-- Add icon column to folders table
-- Stores emoji or icon identifier
ALTER TABLE folders ADD COLUMN IF NOT EXISTS icon VARCHAR(32) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN folders.icon IS 'Emoji or icon identifier for the folder';
