import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';

interface RouteParams {
  params: Promise<{ id: string; markId: string }>;
}

// GET single mark
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { markId } = await params;
  const supabase = createServiceClient();

  const { data: mark, error } = await supabase
    .from('marks')
    .select('*')
    .eq('id', markId)
    .eq('user_id', user.id)
    .single();

  if (error || !mark) {
    return NextResponse.json({ error: 'Mark not found' }, { status: 404 });
  }

  return NextResponse.json({ mark });
}

// PATCH update mark
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { markId } = await params;
  const supabase = createServiceClient();

  const body = await request.json();
  const { text, color, note, position } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (text !== undefined) updateData.text = text;
  if (color !== undefined) updateData.color = color;
  if (note !== undefined) updateData.note = note;
  if (position !== undefined) updateData.position = position;

  const { data: mark, error } = await supabase
    .from('marks')
    .update(updateData)
    .eq('id', markId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !mark) {
    return NextResponse.json({ error: 'Mark not found' }, { status: 404 });
  }

  return NextResponse.json({ mark });
}

// DELETE mark
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { markId } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('marks')
    .delete()
    .eq('id', markId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
