-- Create bookmarks-backup storage bucket for Chrome bookmark backup files
INSERT INTO storage.buckets (id, name, public)
VALUES ('bookmarks-backup', 'bookmarks-backup', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for bookmarks-backup bucket
CREATE POLICY "Users can upload their own backups" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bookmarks-backup' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own backups" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bookmarks-backup' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own backups" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bookmarks-backup' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Service role full access to backups" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'bookmarks-backup')
  WITH CHECK (bucket_id = 'bookmarks-backup');
