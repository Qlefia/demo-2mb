-- Phase 2.4 — Tasks RLS hardening.
--
-- Plan: ops/founder can DELETE any task (cleanup typos / wrong assignments).
-- Sales does NOT get DELETE — they cancel by setting status='cancelled' so the
-- audit trail stays intact. (Founder already has activities_founder_all
-- analogue via tasks_founder_all FOR ALL.)
--
-- Sales also needs to cancel/complete tasks they're NOT assigned to but live
-- on a prospect they own — but the existing `tasks_sales_select/update` keys
-- on `assignee_id = auth.uid()`, which already covers the common case
-- (Ops creates a task with assignee_id = the sales rep). No change needed.

drop policy if exists "tasks_ops_delete" on public.tasks;
create policy "tasks_ops_delete" on public.tasks
  for delete to authenticated
  using (public.is_ops());
