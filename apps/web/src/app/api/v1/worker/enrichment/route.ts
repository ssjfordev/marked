/**
 * Enrichment Worker API
 *
 * POST /api/v1/worker/enrichment - Trigger enrichment processing
 *
 * This endpoint is designed to be called by:
 * - Vercel Cron
 * - External scheduler
 * - Manual trigger (admin)
 *
 * Security: Requires CRON_SECRET header for production
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWorkerIteration } from '@/lib/enrichment';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

const MAX_ITERATIONS = 5;

export async function POST(request: NextRequest) {
  // Verify cron secret in production
  if (process.env.ENV === 'production') {
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const workerId = `vercel-${uuidv4().slice(0, 8)}`;
  let totalProcessed = 0;

  try {
    // Run multiple iterations within the time limit
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const processed = await runWorkerIteration(workerId);
      totalProcessed += processed;

      // If no jobs available, stop early
      if (processed === 0) {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      workerId,
      jobsProcessed: totalProcessed,
    });
  } catch (err) {
    console.error('Enrichment worker error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        jobsProcessed: totalProcessed,
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
