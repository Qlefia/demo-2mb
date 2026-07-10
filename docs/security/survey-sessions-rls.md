# `survey_sessions` and RLS (BACKLOG #34)

## Facts

- Table `public.survey_sessions` has **RLS enabled** and **no policies** (Supabase linter: `rls_enabled_no_policy`).
- Application access for create/read/update is via **Next.js route handlers** using **Supabase service role** (`createServiceRoleClient()`), which **bypasses RLS**.

## Decision

- **Current model:** intentional — only the server service role touches this table; anon/authenticated clients must not query it directly.
- **If** any client-side or anon-key path ever reads `survey_sessions`, add explicit RLS policies before exposing it.

## References

- [RLS enabled no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
