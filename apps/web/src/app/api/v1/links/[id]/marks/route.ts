import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET all marks for a canonical link
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: marks, error } = await supabase
    .from('marks')
    .select('*')
    .eq('link_canonical_id', id)
    .eq('user_id', user.id)
    .order('position');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ marks });
}

// POST create a new mark
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  const body = await request.json();
  const { text, color = '#FFEB3B', note, position } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  // Get next position if not provided
  let markPosition = position;
  if (markPosition === undefined) {
    const { data: lastMark } = await supabase
      .from('marks')
      .select('position')
      .eq('link_canonical_id', id)
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    markPosition = (lastMark?.position ?? 0) + 1;
  }

  const { data: mark, error } = await supabase
    .from('marks')
    .insert({
      user_id: user.id,
      link_canonical_id: id,
      text,
      color,
      note: note || null,
      position: markPosition,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mark }, { status: 201 });
}
