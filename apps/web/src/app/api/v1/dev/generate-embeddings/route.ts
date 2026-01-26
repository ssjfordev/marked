/**
 * Generate Embeddings for Existing Links (Development Only)
 * POST /api/v1/dev/generate-embeddings
 *
 * Generates embeddings for link_canonicals that don't have them yet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';
import { generateLinkEmbedding } from '@/lib/ai';

// Only allow in development
export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const { limit = 10 } = body;

    const supabase = createServiceClient();

    // Get link_canonicals without embeddings that belong to this user's instances
    const { data: canonicals, error: fetchError } = await supabase
      .from('link_canonicals')
      .select(`
        id,
        original_url,
        title,
        description,
        link_instances!inner(user_id)
      `)
      .eq('link_instances.user_id', user.id)
      .is('embedding', null)
      .limit(Math.min(limit, 100));

    if (fetchError) {
      throw fetchError;
    }

    if (!canonicals || canonicals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No links need embedding generation',
        processed: 0,
        total: 0,
      });
    }

    // Get unique canonicals (remove duplicates from join)
    const uniqueCanonicals = Array.from(
      new Map(canonicals.map((c) => [c.id, c])).values()
    );

    // Generate embeddings
    const results: Array<{
      id: string;
      title: string | null;
      success: boolean;
      error?: string;
    }> = [];

    for (const canonical of uniqueCanonicals) {
      const embeddingResult = await generateLinkEmbedding({
        url: canonical.original_url,
        title: canonical.title,
        description: canonical.description,
      });

      if (embeddingResult.success && embeddingResult.embedding) {
        // Update link_canonical with embedding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await supabase
          .from('link_canonicals')
          .update({ embedding: embeddingResult.embedding } as any)
          .eq('id', canonical.id);

        if (updateError) {
          results.push({
            id: canonical.id,
            title: canonical.title,
            success: false,
            error: updateError.message,
          });
        } else {
          results.push({
            id: canonical.id,
            title: canonical.title,
            success: true,
          });
        }
      } else {
        results.push({
          id: canonical.id,
          title: canonical.title,
          success: false,
          error: embeddingResult.error,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated embeddings for ${successCount} links, ${failCount} failed`,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('[Generate Embeddings Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET to check status
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  const user = await requireUser();
  const supabase = createServiceClient();

  // Count link_canonicals with and without embeddings for this user
  const { count: totalCount } = await supabase
    .from('link_canonicals')
    .select('*, link_instances!inner(user_id)', { count: 'exact', head: true })
    .eq('link_instances.user_id', user.id);

  const { count: withEmbedding } = await supabase
    .from('link_canonicals')
    .select('*, link_instances!inner(user_id)', { count: 'exact', head: true })
    .eq('link_instances.user_id', user.id)
    .not('embedding', 'is', null);

  return NextResponse.json({
    success: true,
    total: totalCount || 0,
    withEmbedding: withEmbedding || 0,
    withoutEmbedding: (totalCount || 0) - (withEmbedding || 0),
  });
}
