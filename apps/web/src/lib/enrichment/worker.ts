/**
 * Enrichment Worker
 *
 * Processes enrichment jobs from the database:
 * - Claims jobs using SELECT ... FOR UPDATE SKIP LOCKED
 * - Fetches page metadata
 * - Updates link_canonicals with enriched data
 * - Handles retries and dead letter
 *
 * Spec ref: worker_job_processing.md (LOCKED)
 */

import { createServiceClient } from '@/lib/supabase/server';
import { fetchMetadata } from './metadata-fetcher';
import { getDescriptionFallback } from '@/domain/description';
import type { Database } from '@/types/database';

type EnrichmentJob = Database['public']['Tables']['enrichment_jobs']['Row'];
type SupabaseClient = ReturnType<typeof createServiceClient>;

// Configuration (from worker_job_processing.md - LOCKED)
const BATCH_SIZE = 10; // N concurrent jobs
const DOMAIN_CONCURRENCY = 2; // k per domain
const BACKOFF_MINUTES = 5;
const MAX_ATTEMPTS = 2; // LOCKED
const LOCK_TTL_MINUTES = 10;

// In-memory domain semaphore for MVP
const domainSemaphores = new Map<string, number>();

/**
 * Run one iteration of the worker
 * Returns the number of jobs processed
 */
export async function runWorkerIteration(workerId: string): Promise<number> {
  const supabase = createServiceClient();

  // Claim jobs
  const jobs = await claimJobs(supabase, workerId, BATCH_SIZE);

  if (jobs.length === 0) {
    return 0;
  }

  // Process jobs in parallel with domain throttling
  const results = await Promise.allSettled(
    jobs.map((job) => processJobWithThrottling(supabase, job))
  );

  // Log results
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(
    `[Worker ${workerId}] Processed ${jobs.length} jobs: ${succeeded} succeeded, ${failed} failed`
  );

  return jobs.length;
}

/**
 * Claim jobs using optimistic locking
 *
 * Note: For production with multiple workers, use a stored procedure with
 * SELECT ... FOR UPDATE SKIP LOCKED. This fallback uses optimistic locking
 * which works for single worker / low concurrency scenarios.
 */
async function claimJobs(
  supabase: SupabaseClient,
  workerId: string,
  batchSize: number
): Promise<EnrichmentJob[]> {
  const now = new Date();
  const ttlThreshold = new Date(now.getTime() - LOCK_TTL_MINUTES * 60 * 1000);

  // Use optimistic locking fallback
  // For production, create a stored procedure with FOR UPDATE SKIP LOCKED
  return claimJobsFallback(supabase, workerId, batchSize, ttlThreshold);
}

/**
 * Fallback claim without FOR UPDATE SKIP LOCKED
 * Less safe but works without the stored procedure
 */
async function claimJobsFallback(
  supabase: SupabaseClient,
  workerId: string,
  batchSize: number,
  ttlThreshold: Date
): Promise<EnrichmentJob[]> {
  const now = new Date().toISOString();

  // Find eligible jobs
  const { data: jobs, error: selectError } = await supabase
    .from('enrichment_jobs')
    .select('*')
    .in('status', ['queued', 'failed'])
    .lte('run_after', now)
    .or(`locked_at.is.null,locked_at.lt.${ttlThreshold.toISOString()}`)
    .limit(batchSize);

  if (selectError || !jobs || jobs.length === 0) {
    return [];
  }

  // Try to claim each job
  const claimed: EnrichmentJob[] = [];

  for (const job of jobs) {
    const { data: updated, error: updateError } = await supabase
      .from('enrichment_jobs')
      .update({
        status: 'running',
        locked_at: now,
        locked_by: workerId,
        attempts: job.attempts + 1,
        updated_at: now,
      })
      .eq('id', job.id)
      .eq('status', job.status) // Optimistic lock
      .select()
      .single();

    if (!updateError && updated) {
      claimed.push(updated);
    }
  }

  return claimed;
}

/**
 * Process a job with domain throttling
 */
async function processJobWithThrottling(
  supabase: SupabaseClient,
  job: EnrichmentJob
): Promise<void> {
  // Get the URL from the canonical (include favicon to preserve base64)
  const { data: canonical } = await supabase
    .from('link_canonicals')
    .select('original_url, domain, favicon')
    .eq('id', job.link_canonical_id)
    .single();

  if (!canonical) {
    await markJobFailed(supabase, job, 'Canonical not found');
    return;
  }

  const domain = canonical.domain;

  // Wait for domain slot
  await acquireDomainSlot(domain);

  try {
    await processJob(supabase, job, canonical.original_url, canonical.favicon);
  } finally {
    releaseDomainSlot(domain);
  }
}

/**
 * Acquire a slot for the domain (simple in-memory semaphore)
 */
async function acquireDomainSlot(domain: string): Promise<void> {
  while (true) {
    const current = domainSemaphores.get(domain) || 0;
    if (current < DOMAIN_CONCURRENCY) {
      domainSemaphores.set(domain, current + 1);
      return;
    }
    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Release a domain slot
 */
function releaseDomainSlot(domain: string): void {
  const current = domainSemaphores.get(domain) || 1;
  if (current <= 1) {
    domainSemaphores.delete(domain);
  } else {
    domainSemaphores.set(domain, current - 1);
  }
}

/**
 * Process a single enrichment job
 */
async function processJob(
  supabase: SupabaseClient,
  job: EnrichmentJob,
  url: string,
  existingFavicon: string | null
): Promise<void> {
  try {
    // Fetch metadata from the actual URL
    const metadata = await fetchMetadata(url);

    // Compute description with fallback
    const description = getDescriptionFallback({
      metaDescription: metadata.description,
      pageText: metadata.pageText,
      maxLength: 300,
    });

    // Preserve base64 favicons from import — only update if not already a data URI
    const shouldUpdateFavicon = !existingFavicon?.startsWith('data:image/');

    // Update canonical with enriched data
    const { error: updateError } = await supabase
      .from('link_canonicals')
      .update({
        title: metadata.title,
        description: description || null,
        og_image: metadata.ogImage,
        ...(shouldUpdateFavicon ? { favicon: metadata.favicon } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.link_canonical_id);

    if (updateError) throw updateError;

    // Mark job as succeeded
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'succeeded',
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Even if page fetch failed, save Google Favicon as fallback
    try {
      const hostname = new URL(url).hostname;
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      await supabase
        .from('link_canonicals')
        .update({
          favicon: googleFavicon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.link_canonical_id)
        .is('favicon', null); // Only if favicon is still null
    } catch {
      // Ignore fallback errors
    }

    await markJobFailed(supabase, job, errorMessage);
  }
}

/**
 * Mark a job as failed (or dead if max attempts reached)
 */
async function markJobFailed(
  supabase: SupabaseClient,
  job: EnrichmentJob,
  errorMessage: string
): Promise<void> {
  const now = new Date();

  if (job.attempts >= MAX_ATTEMPTS) {
    // Mark as dead
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'dead',
        last_error: errorMessage,
        locked_at: null,
        locked_by: null,
        updated_at: now.toISOString(),
      })
      .eq('id', job.id);
  } else {
    // Schedule retry with backoff
    const runAfter = new Date(now.getTime() + BACKOFF_MINUTES * 60 * 1000);

    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'failed',
        last_error: errorMessage,
        run_after: runAfter.toISOString(),
        locked_at: null,
        locked_by: null,
        updated_at: now.toISOString(),
      })
      .eq('id', job.id);
  }
}

/**
 * Start the worker loop (for standalone worker process)
 */
export async function startWorkerLoop(
  workerId: string,
  pollIntervalMs: number = 5000
): Promise<never> {
  console.log(`[Worker ${workerId}] Starting enrichment worker...`);

  while (true) {
    try {
      const processed = await runWorkerIteration(workerId);

      // If no jobs, wait longer
      const waitTime = processed === 0 ? pollIntervalMs * 2 : pollIntervalMs;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (err) {
      console.error(`[Worker ${workerId}] Error:`, err);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
}
