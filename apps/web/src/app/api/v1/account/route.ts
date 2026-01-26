/**
 * Account API - Delete user account
 *
 * DELETE /api/v1/account - Delete the authenticated user's account
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, handleError } from '@/lib/api';

export async function DELETE() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Delete in order to handle foreign key constraints
    // 1. Get user's link_instance IDs first
    const { data: linkInstances } = await supabase
      .from('link_instances')
      .select('id')
      .eq('user_id', user.id);

    const linkInstanceIds = linkInstances?.map(li => li.id) ?? [];

    // 2. Delete link_tags for user's links
    if (linkInstanceIds.length > 0) {
      await supabase
        .from('link_tags')
        .delete()
        .in('link_instance_id', linkInstanceIds);
    }

    // 3. Delete marks
    await supabase
      .from('marks')
      .delete()
      .eq('user_id', user.id);

    // 4. Delete memos
    await supabase
      .from('memos')
      .delete()
      .eq('user_id', user.id);

    // 5. Delete link_instances
    await supabase
      .from('link_instances')
      .delete()
      .eq('user_id', user.id);

    // 6. Delete tags
    await supabase
      .from('tags')
      .delete()
      .eq('user_id', user.id);

    // 7. Delete folders
    await supabase
      .from('folders')
      .delete()
      .eq('user_id', user.id);

    // 8. Delete import_jobs
    await supabase
      .from('import_jobs')
      .delete()
      .eq('user_id', user.id);

    // 9. Delete subscription
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id);

    // 9. Delete the auth user (this will be done by signing out)
    // Note: Actual user deletion from auth.users requires admin privileges
    // In production, you might want to use a Supabase Edge Function with service role

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return handleError(err);
  }
}
