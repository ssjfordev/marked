/**
 * Bookmarks Backup API
 *
 * POST /api/v1/bookmarks/backup - Upload Chrome bookmarks backup HTML
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, handleError, ValidationError } from '@/lib/api';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BACKUPS_PER_USER = 5;
const BUCKET_NAME = 'bookmarks-backup';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ValidationError('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File too large (max 5MB)');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}.html`;
    const storagePath = `${user.id}/${filename}`;

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Clean up old backups (keep only MAX_BACKUPS_PER_USER)
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list(user.id, { sortBy: { column: 'created_at', order: 'asc' } });

    if (existingFiles && existingFiles.length > MAX_BACKUPS_PER_USER) {
      const toDelete = existingFiles
        .slice(0, existingFiles.length - MAX_BACKUPS_PER_USER)
        .map((f) => `${user.id}/${f.name}`);

      await supabase.storage.from(BUCKET_NAME).remove(toDelete);
    }

    return NextResponse.json({ data: { success: true, filename } }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
