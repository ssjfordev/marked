-- Add is_favorite column to link_instances
ALTER TABLE link_instances ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for favorites queries
CREATE INDEX idx_link_instances_user_favorites ON link_instances(user_id, is_favorite) WHERE is_favorite = TRUE;
