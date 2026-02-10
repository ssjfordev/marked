import { requireAuth, success, handleError } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    const { data } = await supabase
      .from('user_preferences')
      .select('language')
      .eq('user_id', user.id)
      .maybeSingle();

    return success({ language: data?.language ?? null });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { language } = body;

    if (language && language !== 'ko' && language !== 'en') {
      return Response.json({ error: 'Invalid language' }, { status: 400 });
    }

    const supabase = createServiceClient();

    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, language, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    return success({ language });
  } catch (err) {
    return handleError(err);
  }
}
