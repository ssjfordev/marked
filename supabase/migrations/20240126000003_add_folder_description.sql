-- Add description column to folders
ALTER TABLE folders ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
