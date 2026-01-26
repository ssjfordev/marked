-- ============================================
-- ADD SHORT IDs TO FOLDERS AND LINK_CANONICALS
-- Shorter, URL-friendly IDs (nanoid-style)
-- ============================================

-- Create nanoid generation function
-- Generates URL-safe random strings (alphabet: A-Za-z0-9_-)
CREATE OR REPLACE FUNCTION generate_short_id(size INT DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
    alphabet TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..size LOOP
        result := result || substr(alphabet, floor(random() * 64 + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Add short_id column to folders
ALTER TABLE folders ADD COLUMN short_id VARCHAR(16) UNIQUE;

-- Add short_id column to link_canonicals
ALTER TABLE link_canonicals ADD COLUMN short_id VARCHAR(16) UNIQUE;

-- Backfill existing folders with short_ids
UPDATE folders SET short_id = generate_short_id(12) WHERE short_id IS NULL;

-- Backfill existing link_canonicals with short_ids
UPDATE link_canonicals SET short_id = generate_short_id(12) WHERE short_id IS NULL;

-- Make short_id NOT NULL after backfill
ALTER TABLE folders ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE link_canonicals ALTER COLUMN short_id SET NOT NULL;

-- Set default for new records
ALTER TABLE folders ALTER COLUMN short_id SET DEFAULT generate_short_id(12);
ALTER TABLE link_canonicals ALTER COLUMN short_id SET DEFAULT generate_short_id(12);

-- Create indexes for fast lookups
CREATE INDEX idx_folders_short_id ON folders(short_id);
CREATE INDEX idx_link_canonicals_short_id ON link_canonicals(short_id);
