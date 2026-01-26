-- Add share_id column to folders for public sharing
ALTER TABLE folders ADD COLUMN IF NOT EXISTS share_id VARCHAR(16) UNIQUE DEFAULT NULL;

-- Index for fast lookup by share_id
CREATE INDEX IF NOT EXISTS idx_folders_share_id ON folders(share_id) WHERE share_id IS NOT NULL;
