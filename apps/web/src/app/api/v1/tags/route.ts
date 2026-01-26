/**
 * Tags API - List user's tags
 *
 * GET /api/v1/tags - Get all tags for authenticated user
 */

import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createServerClient();

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) throw error;

    return success(tags ?? []);
  } catch (err) {
    return handleError(err);
  }
}
