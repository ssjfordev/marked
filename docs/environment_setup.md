# Environment Setup Guide

## New Supabase Project Setup

When creating a new Supabase project for a new environment (dev, staging, etc.), follow these steps:

### 1. Create Supabase Project

Create a new project via [Supabase Dashboard](https://supabase.com/dashboard).

### 2. Apply Database Migrations

Migrations must be applied **in order**. Run each SQL file against the new project:

```bash
# Required migrations (in order):
supabase/migrations/20240124000001_initial_schema.sql    # Tables, types, extensions, triggers
supabase/migrations/20240124000002_rls_policies.sql      # Row Level Security
supabase/migrations/20240124000003_auto_subscription.sql # Auto subscription on signup
supabase/migrations/20240124000004_add_is_favorite.sql   # Favorites column
supabase/migrations/20240124000005_add_semantic_search.sql # pgvector (optional, requires extension)
supabase/migrations/20240124000006_add_short_ids.sql     # Short ID generation
supabase/migrations/20240126000001_add_folder_icon.sql   # Folder icons
supabase/migrations/20240126000002_add_folder_share.sql  # Folder sharing
supabase/migrations/20240126000003_add_folder_description.sql # Folder descriptions
```

### 3. Verify Tables

After migration, the following tables must exist:

| Table | Purpose |
|-------|---------|
| `folders` | Folder tree structure |
| `link_canonicals` | Deduplicated URLs with metadata |
| `link_instances` | User's link placements in folders |
| `tags` | User-defined tags |
| `link_tags` | Link-tag junction |
| `marks` | Highlighted text |
| `memos` | User notes per link |
| `subscriptions` | Billing/plan info |
| `import_jobs` | Import progress tracking |
| `enrichment_jobs` | URL metadata fetch queue |

### 4. Verify Key Columns

Common schema mismatch issues:

- `import_jobs.last_error` (NOT `error_message`) - text column for error details
- `link_instances.is_favorite` - boolean column
- `folders.short_id` / `link_canonicals.short_id` - NOT NULL with default
- `folders.icon`, `folders.share_id`, `folders.description` - nullable columns

### 5. Configure Vercel Environment Variables

Set these in the Vercel project settings for the environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
ENV=development|production
NEXT_PUBLIC_APP_URL=<deployment-url>
CRON_SECRET=<random-secret>   # Required for production enrichment worker
```

### 6. Configure Google OAuth

1. Add the deployment URL to Google Cloud Console authorized redirect URIs
2. Add the Supabase auth callback URL: `https://<project-id>.supabase.co/auth/v1/callback`
3. Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in Vercel

### 7. Verify Auth Setup

In Supabase Dashboard > Authentication > Providers:
- Enable Google provider
- Set Client ID and Client Secret
- Set redirect URL

---

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `ENV` | Vercel | `development` or `production` (NOT `NODE_ENV`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel | Supabase anon/publishable key |
| `SUPABASE_SECRET_KEY` | Vercel | Supabase service role key |
| `CRON_SECRET` | Vercel | Secret for enrichment worker auth (prod only) |
| `NEXT_PUBLIC_APP_URL` | Vercel | Deployment base URL |

## Supabase Projects

| Project | ID | Environment |
|---------|-----|-------------|
| marked | `unijyzvomfsduvnfuhnj` | Local dev (via .env.local) |
| marked-dev | `oamtzuzmrbdufnwslsou` | Vercel dev deployment |
| marked-prd | `abxuyhoqqmbgjilngyjp` | Production |

## Troubleshooting

### Import stuck at "running" with 0 processed items
- **Cause**: Missing tables in the Supabase project (folders, link_canonicals, etc.)
- **Fix**: Apply all migrations to the target database

### Enrichment worker returns "Unauthorized"
- **Cause**: `CRON_SECRET` not set, or using `NODE_ENV` check instead of `ENV`
- **Fix**: Set `CRON_SECRET` in Vercel, or ensure `ENV !== 'production'` for dev

### Column name mismatch errors
- **Cause**: DB schema out of sync with code (e.g., `error_message` vs `last_error`)
- **Fix**: Re-apply migrations from scratch or run ALTER TABLE to fix column names
