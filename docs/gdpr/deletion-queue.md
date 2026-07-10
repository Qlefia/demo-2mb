# Deletion queue (BACKLOG #25) — optional future design

## Product decision (immediate deletion)

As of 2026-03, **account and workspace deletion use immediate removal** from production systems (`app/api/workspace/delete/route.ts`, `app/api/account/delete/route.ts` after subscription checks). In-app copy and the Privacy Policy retention section match this behaviour.

A **delayed purge queue is not required by GDPR**. Art. 12(3) GDPR sets a **one-calendar-month** deadline for informing data subjects about measures taken on their requests; Art. 17 requires erasure **without undue delay** where it applies — not a mandatory user-facing “cooling-off” period. Any future grace period would be a **product and security** choice (e.g. hijack recovery, replication lag) and must be **proportionate**, transparent, and minimising of processing during the window — not framed as “required by GDPR”. See EDPB guidance on deceptive design patterns.

## If we implement a queue later

Goal (optional): soft-delete state + delayed hard purge with optional restore, **only if** the team chooses that UX.

### Phase 1 — Specification

- Entities: user (auth), `users` row, `workspaces`, related surveys/leads/responses.
- States: `active` → `pending_deletion_at` → purged by job after TTL.
- Restore window: same TTL; UI to cancel deletion.

### Phase 2 — Schema

- Columns or table for `scheduled_deletion_at`, `deletion_reason`, audit log.
- Coordinate with `auth.admin.deleteUser` timing (e.g. revoke access immediately, purge auth row when the job runs).

### Phase 3 — Jobs

- Supabase **pg_cron**, Edge Function, or external queue (Inngest/QStash per AGENTS.md) to run purge.

### Phase 4 — Product

- Settings copy, email notice, export reminder before purge; legal review of wording.

Implementation, when pursued, is tracked in BACKLOG **#25**.
