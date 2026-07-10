-- ============================================================================
-- Phase 2.3: User-logged activities (note, call, email, linkedin) need to be
-- editable and deletable. RLS gates who can touch which row; the API gates
-- which `type` values are mutable (system types like stage_change stay
-- immutable even for founder).
-- ============================================================================

-- Ops/founder can moderate any activity row (founder already covered by
-- activities_founder_all). System-event protection lives in the API layer.
drop policy if exists "activities_ops_update" on public.activities;
create policy "activities_ops_update" on public.activities
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "activities_ops_delete" on public.activities;
create policy "activities_ops_delete" on public.activities
  for delete to authenticated
  using (public.is_ops());

-- Sales can edit/delete only their own user-logged activities, on prospects
-- they're already allowed to see. actor_id check prevents impersonation;
-- prospect visibility check prevents leaking activity rows from other
-- territories. API still rejects system types.
drop policy if exists "activities_sales_update" on public.activities;
create policy "activities_sales_update" on public.activities
  for update to authenticated
  using (
    public.is_sales()
    and actor_id = auth.uid()
    and exists (
      select 1 from public.prospects p
      where p.id = activities.prospect_id
        and (
          p.owner_id = auth.uid()
          or (
            p.territory = public.sales_territory()
            and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
          )
        )
    )
  )
  with check (
    public.is_sales()
    and actor_id = auth.uid()
  );

drop policy if exists "activities_sales_delete" on public.activities;
create policy "activities_sales_delete" on public.activities
  for delete to authenticated
  using (
    public.is_sales()
    and actor_id = auth.uid()
    and exists (
      select 1 from public.prospects p
      where p.id = activities.prospect_id
        and (
          p.owner_id = auth.uid()
          or (
            p.territory = public.sales_territory()
            and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
          )
        )
    )
  );
