-- Security hardening from Phase 2 audit (P0 #1, P1 #4, P1 #6)
-- 1. `current_role()` defaulted to 'admin' for missing JWT app_metadata.role,
--    which silently granted SELECT-everywhere to any authenticated principal
--    that hadn't been provisioned through the team flow. Default to a sentinel
--    that does not match any of the policy roles, so the user is denied by
--    default until an explicit role is assigned.
-- 2. `triggers_sales_select` was unscoped — every sales seat could read every
--    trigger across territories. Scope to triggers attached to a prospect they
--    can already see (own territory + dossier_ready+ stage, or owner).
-- 3. `playbooks_sales_select` was also unscoped. Sales seats only need
--    playbooks that are referenced by a prospect/dossier they can already see.

-- ---------------------------------------------------------------------------
-- 1. current_role() — secure default
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    'unassigned'
  )
$$;

-- ---------------------------------------------------------------------------
-- 2. triggers_sales_select — scope by prospect visibility
-- ---------------------------------------------------------------------------
drop policy if exists "triggers_sales_select" on public.triggers;
create policy "triggers_sales_select" on public.triggers
  for select to authenticated
  using (
    public.is_sales()
    and (
      -- Triggers always reference an account; check via any prospect on that
      -- account that the sales seat is allowed to see.
      exists (
        select 1
        from public.prospects p
        where p.account_id = triggers.account_id
          and (
            p.owner_id = auth.uid()
            or (
              p.territory = public.sales_territory()
              and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
            )
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. playbooks_sales_select — restrict to playbooks referenced by visible prospects
-- ---------------------------------------------------------------------------
drop policy if exists "playbooks_sales_select" on public.playbooks;
create policy "playbooks_sales_select" on public.playbooks
  for select to authenticated
  using (
    public.is_sales()
    and (
      exists (
        select 1
        from public.prospects p
        where p.suggested_playbook_id = playbooks.id
          and (
            p.owner_id = auth.uid()
            or (
              p.territory = public.sales_territory()
              and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
            )
          )
      )
      or exists (
        select 1
        from public.dossiers d
        join public.prospects p on p.id = d.prospect_id
        where d.suggested_playbook_id = playbooks.id
          and (
            p.owner_id = auth.uid()
            or (
              p.territory = public.sales_territory()
              and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
            )
          )
      )
    )
  );
