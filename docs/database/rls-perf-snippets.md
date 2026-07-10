# RLS and index snippets (BACKLOG #36)

**2026-03-25:** Addressed in `supabase/migrations/20260325120000_rls_initplan_and_fk_indexes.sql` (applied to linked project via MCP). Re-run Database Advisor after deploy.

Supabase Database Linter reported:

- **WARN** `auth_rls_initplan`: policies on `survey_folders`, `subscriptions`, `workspace_integration_api_keys`, `survey_integration_settings` re-evaluate `auth.uid()` per row. Fix pattern: wrap in subquery, e.g. `(select auth.uid())` instead of `auth.uid()` where applicable.
- **INFO** Unindexed FKs: `leads.response_id`, `survey_folders.parent_id`, `survey_folders.workspace_id`, `surveys.folder_id`.

## Before applying

1. Run `EXPLAIN` on hot queries in staging.
2. Apply via **one** migration pipeline (see BACKLOG **#35**): prefer `supabase/migrations` + MCP `apply_migration` per project rules.

## Example (illustrative only)

```sql
-- Replace per policy; verify policy names in Dashboard SQL editor
-- DROP POLICY ... ; CREATE POLICY ... USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (SELECT auth.uid())));
```

Add covering indexes on FK columns only after confirming query plans.
