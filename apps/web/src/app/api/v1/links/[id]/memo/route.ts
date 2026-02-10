import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';
import { canAccessMemo } from '@/domain/entitlement/checker';
import { sanitizeText, TEXT_LIMITS } from '@/lib/api/sanitize';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET memo for a canonical link
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: memo, error } = await supabase
    .from('memos')
    .select('*')
    .eq('link_canonical_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ memo });
}

// PUT (upsert) memo for a canonical link
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  // Check entitlement
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const entitlement = subscription
    ? {
        plan: subscription.plan as 'free' | 'pro' | 'lifetime',
        status: subscription.status as 'active' | 'trialing' | 'past_due' | 'canceled',
      }
    : null;

  if (!canAccessMemo(entitlement)) {
    return NextResponse.json({ error: 'Memo feature requires Pro subscription' }, { status: 403 });
  }

  const body = await request.json();
  const rawContent = body?.content;

  if (typeof rawContent !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const content = sanitizeText(rawContent).slice(0, TEXT_LIMITS.LONG_TEXT);

  // Upsert memo
  const { data: existingMemo } = await supabase
    .from('memos')
    .select('id')
    .eq('link_canonical_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  let memo;
  if (existingMemo) {
    const { data, error } = await supabase
      .from('memos')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMemo.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    memo = data;
  } else {
    const { data, error } = await supabase
      .from('memos')
      .insert({
        user_id: user.id,
        link_canonical_id: id,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    memo = data;
  }

  return NextResponse.json({ memo });
}
