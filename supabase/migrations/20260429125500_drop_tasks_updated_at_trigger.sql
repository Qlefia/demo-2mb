-- Phase 2.4 fix-up.
--
-- The Phase 0 generic `tg_set_updated_at()` trigger was applied to `tasks`
-- (alongside accounts/contacts/prospects/dossiers/playbooks) but the `tasks`
-- table never gained an `updated_at` column — its lifecycle uses `completed_at`
-- + status flow instead. The trigger therefore raised
-- `record "new" has no field "updated_at"` on every UPDATE.
--
-- Drop just the misapplied trigger; keep the function and the per-table
-- triggers on the tables that actually have `updated_at`.

drop trigger if exists tg_tasks_set_updated_at on public.tasks;
