import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/actions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT reorder a link within a folder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = createServiceClient();

  const body = await request.json();
  const { position, folderId } = body;

  if (typeof position !== 'number' || !folderId) {
    return NextResponse.json({ error: 'Position and folderId are required' }, { status: 400 });
  }

  // Verify ownership of the link
  const { data: link } = await supabase
    .from('link_instances')
    .select('id, position, folder_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  const oldPosition = link.position;

  // If moving to a different folder or same position, no reordering needed
  if (link.folder_id !== folderId) {
    // Moving to a different folder - just update the position
    const { error } = await supabase
      .from('link_instances')
      .update({ position, folder_id: folderId, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (oldPosition === position) {
    return NextResponse.json({ success: true });
  }

  // Reorder within the same folder
  // First, get all links in the folder
  const { data: folderLinks } = await supabase
    .from('link_instances')
    .select('id, position')
    .eq('folder_id', folderId)
    .eq('user_id', user.id)
    .order('position');

  if (!folderLinks) {
    return NextResponse.json({ error: 'Failed to fetch folder links' }, { status: 500 });
  }

  // Calculate new positions
  const updates: { id: string; position: number }[] = [];

  if (oldPosition < position) {
    // Moving down - shift items up
    for (const l of folderLinks) {
      if (l.id === id) {
        updates.push({ id: l.id, position });
      } else if (l.position > oldPosition && l.position <= position) {
        updates.push({ id: l.id, position: l.position - 1 });
      }
    }
  } else {
    // Moving up - shift items down
    for (const l of folderLinks) {
      if (l.id === id) {
        updates.push({ id: l.id, position });
      } else if (l.position >= position && l.position < oldPosition) {
        updates.push({ id: l.id, position: l.position + 1 });
      }
    }
  }

  // Apply updates
  for (const update of updates) {
    const { error } = await supabase
      .from('link_instances')
      .update({ position: update.position, updated_at: new Date().toISOString() })
      .eq('id', update.id);

    if (error) {
      console.error('Failed to update position:', error);
    }
  }

  return NextResponse.json({ success: true });
}
