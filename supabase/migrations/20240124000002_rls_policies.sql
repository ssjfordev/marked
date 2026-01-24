-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
-- link_canonicals and enrichment_jobs are shared, different policies

-- ============================================
-- FOLDERS POLICIES
-- ============================================
CREATE POLICY "Users can view own folders"
    ON folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
    ON folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
    ON folders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
    ON folders FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- LINK_INSTANCES POLICIES
-- ============================================
CREATE POLICY "Users can view own link instances"
    ON link_instances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own link instances"
    ON link_instances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own link instances"
    ON link_instances FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own link instances"
    ON link_instances FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TAGS POLICIES
-- ============================================
CREATE POLICY "Users can view own tags"
    ON tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
    ON tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
    ON tags FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
    ON tags FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- LINK_TAGS POLICIES
-- Access through link_instances ownership
-- ============================================
CREATE POLICY "Users can view own link tags"
    ON link_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM link_instances
            WHERE link_instances.id = link_tags.link_instance_id
            AND link_instances.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own link tags"
    ON link_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM link_instances
            WHERE link_instances.id = link_tags.link_instance_id
            AND link_instances.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own link tags"
    ON link_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM link_instances
            WHERE link_instances.id = link_tags.link_instance_id
            AND link_instances.user_id = auth.uid()
        )
    );

-- ============================================
-- MARKS POLICIES
-- ============================================
CREATE POLICY "Users can view own marks"
    ON marks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own marks"
    ON marks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marks"
    ON marks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own marks"
    ON marks FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- MEMOS POLICIES
-- ============================================
CREATE POLICY "Users can view own memos"
    ON memos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own memos"
    ON memos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos"
    ON memos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos"
    ON memos FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Insert/Update/Delete managed by server with service role

-- ============================================
-- IMPORT_JOBS POLICIES
-- ============================================
CREATE POLICY "Users can view own import jobs"
    ON import_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import jobs"
    ON import_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update managed by worker with service role

-- ============================================
-- LINK_CANONICALS POLICIES
-- Shared resource - anyone can read if they have an instance
-- ============================================
ALTER TABLE link_canonicals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view canonicals for their instances"
    ON link_canonicals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM link_instances
            WHERE link_instances.link_canonical_id = link_canonicals.id
            AND link_instances.user_id = auth.uid()
        )
    );

-- Insert managed by server/worker with service role

-- ============================================
-- ENRICHMENT_JOBS POLICIES
-- Managed by worker with service role, no direct user access
-- ============================================
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- No user policies - worker uses service role
