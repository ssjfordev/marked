/**
 * Generate Embeddings for Existing Links (Development Only)
 * POST /api/dev/generate-embeddings
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
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { limit = 10, force = false } = body;

    // Get current user
    const user = await requireUser();
    const supabase = createServiceClient();

    // Get link_canonicals that the user has instances for, without embeddings
    // First get user's link_canonical_ids
    const { data: instances } = await supabase
      .from('link_instances')
      .select('link_canonical_id')
      .eq('user_id', user.id);

    if (!instances || instances.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No links found',
        processed: 0,
        total: 0,
      });
    }

    const canonicalIds = [...new Set(instances.map((i) => i.link_canonical_id))];

    // Get canonicals without embeddings (or all if force=true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('link_canonicals')
      .select('id, original_url, title, description')
      .in('id', canonicalIds)
      .limit(Math.min(limit, 50)); // Cap at 50

    if (!force) {
      query = query.is('embedding', null);
    }

    const { data: canonicals, error: fetchError } = (await query) as {
      data: Array<{ id: string; original_url: string; title: string | null; description: string | null }> | null;
      error: Error | null;
    };

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

    // Generate embeddings
    const results: Array<{
      id: string;
      title: string | null;
      success: boolean;
      error?: string;
    }> = [];

    for (const canonical of canonicals) {
      const embeddingResult = await generateLinkEmbedding({
        url: canonical.original_url,
        title: canonical.title,
        description: canonical.description,
      });

      if (embeddingResult.success && embeddingResult.embedding) {
        // Update canonical with embedding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('link_canonicals')
          .update({ embedding: embeddingResult.embedding })
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
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 403 });
  }

  try {
    const user = await requireUser();
    const supabase = createServiceClient();

    // Get user's canonical IDs
    const { data: instances } = await supabase
      .from('link_instances')
      .select('link_canonical_id')
      .eq('user_id', user.id);

    if (!instances || instances.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        withEmbedding: 0,
        withoutEmbedding: 0,
      });
    }

    const canonicalIds = [...new Set(instances.map((i) => i.link_canonical_id))];

    // Count canonicals with and without embeddings
    const { count: totalCount } = await supabase
      .from('link_canonicals')
      .select('*', { count: 'exact', head: true })
      .in('id', canonicalIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: withEmbedding } = await (supabase as any)
      .from('link_canonicals')
      .select('*', { count: 'exact', head: true })
      .in('id', canonicalIds)
      .not('embedding', 'is', null);

    return NextResponse.json({
      success: true,
      total: totalCount || 0,
      withEmbedding: withEmbedding || 0,
      withoutEmbedding: (totalCount || 0) - (withEmbedding || 0),
    });
  } catch (error) {
    console.error('[Check Embeddings Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
