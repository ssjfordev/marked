-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For search (Epic F)

-- Create custom types
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'ai_pro');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE import_job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
CREATE TYPE enrichment_job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead');

-- ============================================
-- FOLDERS
-- Tree structure for organizing links
-- ============================================
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- ============================================
-- LINK_CANONICALS
-- Deduplicated URLs with enrichment data
-- url_key is UNIQUE per spec
-- ============================================
CREATE TABLE link_canonicals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_key VARCHAR(2048) NOT NULL UNIQUE,  -- Canonicalized URL for deduplication
    original_url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    title VARCHAR(512),
    description TEXT,
    og_image TEXT,
    favicon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_canonicals_domain ON link_canonicals(domain);
-- pg_trgm indexes for search (Epic F)
CREATE INDEX idx_link_canonicals_title_trgm ON link_canonicals USING GIN (title gin_trgm_ops);
CREATE INDEX idx_link_canonicals_description_trgm ON link_canonicals USING GIN (description gin_trgm_ops);

-- ============================================
-- LINK_INSTANCES
-- User's placement of a link in a folder
-- Same URL can exist in multiple folders
-- ============================================
CREATE TABLE link_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_canonical_id UUID NOT NULL REFERENCES link_canonicals(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_title VARCHAR(512),        -- User override for title
    user_description TEXT,          -- User override for description
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_instances_user_id ON link_instances(user_id);
CREATE INDEX idx_link_instances_folder_id ON link_instances(folder_id);
CREATE INDEX idx_link_instances_canonical_id ON link_instances(link_canonical_id);
-- Composite for listing links in folder
CREATE INDEX idx_link_instances_folder_position ON link_instances(folder_id, position);

-- ============================================
-- TAGS
-- User-defined tags
-- ============================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name_trgm ON tags USING GIN (name gin_trgm_ops);

-- ============================================
-- LINK_TAGS
-- Junction table for link_instances <-> tags
-- ============================================
CREATE TABLE link_tags (
    link_instance_id UUID NOT NULL REFERENCES link_instances(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (link_instance_id, tag_id)
);

CREATE INDEX idx_link_tags_tag_id ON link_tags(tag_id);

-- ============================================
-- MARKS
-- Highlighted text from web pages
-- Attached to canonical (shared across instances)
-- ============================================
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_canonical_id UUID NOT NULL REFERENCES link_canonicals(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    note TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marks_user_id ON marks(user_id);
CREATE INDEX idx_marks_canonical_id ON marks(link_canonical_id);

-- ============================================
-- MEMOS
-- User notes for a link (Paid feature)
-- One memo per user per canonical link
-- ============================================
CREATE TABLE memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_canonical_id UUID NOT NULL REFERENCES link_canonicals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, link_canonical_id)
);

CREATE INDEX idx_memos_user_id ON memos(user_id);

-- ============================================
-- SUBSCRIPTIONS
-- User billing/plan information
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan plan_type NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ============================================
-- IMPORT_JOBS
-- Track bookmark import progress
-- ============================================
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL DEFAULT 'chrome_html',
    status import_job_status NOT NULL DEFAULT 'queued',
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- ============================================
-- ENRICHMENT_JOBS
-- Track URL metadata enrichment
-- link_canonical_id is UNIQUE per spec (one enrichment per URL)
-- ============================================
CREATE TABLE enrichment_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_canonical_id UUID NOT NULL REFERENCES link_canonicals(id) ON DELETE CASCADE UNIQUE,
    status enrichment_job_status NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 2,  -- LOCKED per spec
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by VARCHAR(255),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for worker claim query: SELECT ... FOR UPDATE SKIP LOCKED
-- Spec: status IN ('queued','failed') AND run_after <= now() AND (locked_at IS NULL OR locked_at < now() - interval '10 minutes')
CREATE INDEX idx_enrichment_jobs_claimable ON enrichment_jobs(status, run_after, locked_at)
    WHERE status IN ('queued', 'failed');

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_canonicals_updated_at BEFORE UPDATE ON link_canonicals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_instances_updated_at BEFORE UPDATE ON link_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON memos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichment_jobs_updated_at BEFORE UPDATE ON enrichment_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
