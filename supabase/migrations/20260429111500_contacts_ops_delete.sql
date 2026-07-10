-- ============================================================================
-- Phase 2.2: Ops needs DELETE on contacts to clean up bad enrichment / typo
-- entries. Sales remains read-only. Founder is already covered by
-- contacts_founder_all.
-- ============================================================================
drop policy if exists "contacts_ops_delete" on public.contacts;
create policy "contacts_ops_delete" on public.contacts
  for delete to authenticated
  using (public.is_ops());
