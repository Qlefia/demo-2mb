-- RLS policy matrix per .cursor/rules/roles-rls.mdc.
-- Roles: founder (rw all), admin (r all), ops (rw most, no delete on accounts/etc),
-- sales_de / sales_uk (scoped by territory + stage).
-- The audit trigger fires SECURITY DEFINER and bypasses RLS by virtue of running as
-- the function owner (postgres, BYPASSRLS).

-- ============================================================================
-- accounts
-- ============================================================================
drop policy if exists "accounts_founder_all" on public.accounts;
create policy "accounts_founder_all" on public.accounts
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "accounts_admin_select" on public.accounts;
create policy "accounts_admin_select" on public.accounts
  for select to authenticated using (public.is_admin());

drop policy if exists "accounts_ops_select" on public.accounts;
create policy "accounts_ops_select" on public.accounts
  for select to authenticated using (public.is_ops());
drop policy if exists "accounts_ops_insert" on public.accounts;
create policy "accounts_ops_insert" on public.accounts
  for insert to authenticated with check (public.is_ops());
drop policy if exists "accounts_ops_update" on public.accounts;
create policy "accounts_ops_update" on public.accounts
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "accounts_sales_select" on public.accounts;
create policy "accounts_sales_select" on public.accounts
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.account_id = accounts.id
        and p.territory = public.sales_territory()
    )
  );

-- ============================================================================
-- contacts
-- ============================================================================
drop policy if exists "contacts_founder_all" on public.contacts;
create policy "contacts_founder_all" on public.contacts
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "contacts_admin_select" on public.contacts;
create policy "contacts_admin_select" on public.contacts
  for select to authenticated using (public.is_admin());

drop policy if exists "contacts_ops_select" on public.contacts;
create policy "contacts_ops_select" on public.contacts
  for select to authenticated using (public.is_ops());
drop policy if exists "contacts_ops_insert" on public.contacts;
create policy "contacts_ops_insert" on public.contacts
  for insert to authenticated with check (public.is_ops());
drop policy if exists "contacts_ops_update" on public.contacts;
create policy "contacts_ops_update" on public.contacts
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "contacts_sales_select" on public.contacts;
create policy "contacts_sales_select" on public.contacts
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.account_id = contacts.account_id
        and p.territory = public.sales_territory()
        and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
    )
  );

-- ============================================================================
-- prospects
-- ============================================================================
drop policy if exists "prospects_founder_all" on public.prospects;
create policy "prospects_founder_all" on public.prospects
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "prospects_admin_select" on public.prospects;
create policy "prospects_admin_select" on public.prospects
  for select to authenticated using (public.is_admin());

drop policy if exists "prospects_ops_select" on public.prospects;
create policy "prospects_ops_select" on public.prospects
  for select to authenticated using (public.is_ops());
drop policy if exists "prospects_ops_insert" on public.prospects;
create policy "prospects_ops_insert" on public.prospects
  for insert to authenticated with check (public.is_ops());
drop policy if exists "prospects_ops_update" on public.prospects;
create policy "prospects_ops_update" on public.prospects
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "prospects_sales_select" on public.prospects;
create policy "prospects_sales_select" on public.prospects
  for select to authenticated
  using (
    public.is_sales()
    and (
      owner_id = auth.uid()
      or (
        territory = public.sales_territory()
        and public.stage_rank(stage) >= public.stage_rank('dossier_ready')
      )
    )
  );
drop policy if exists "prospects_sales_update" on public.prospects;
create policy "prospects_sales_update" on public.prospects
  for update to authenticated
  using (
    public.is_sales()
    and (
      owner_id = auth.uid()
      or (
        territory = public.sales_territory()
        and public.stage_rank(stage) >= public.stage_rank('dossier_ready')
      )
    )
  )
  with check (
    public.is_sales()
    and (
      owner_id = auth.uid()
      or (
        territory = public.sales_territory()
        and public.stage_rank(stage) >= public.stage_rank('dossier_ready')
      )
    )
  );

-- ============================================================================
-- triggers
-- ============================================================================
drop policy if exists "triggers_founder_all" on public.triggers;
create policy "triggers_founder_all" on public.triggers
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "triggers_admin_select" on public.triggers;
create policy "triggers_admin_select" on public.triggers
  for select to authenticated using (public.is_admin());

drop policy if exists "triggers_ops_select" on public.triggers;
create policy "triggers_ops_select" on public.triggers
  for select to authenticated using (public.is_ops());
drop policy if exists "triggers_ops_insert" on public.triggers;
create policy "triggers_ops_insert" on public.triggers
  for insert to authenticated with check (public.is_ops());
drop policy if exists "triggers_ops_update" on public.triggers;
create policy "triggers_ops_update" on public.triggers
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "triggers_sales_select" on public.triggers;
create policy "triggers_sales_select" on public.triggers
  for select to authenticated
  using (public.is_sales());

-- ============================================================================
-- dossiers
-- ============================================================================
drop policy if exists "dossiers_founder_all" on public.dossiers;
create policy "dossiers_founder_all" on public.dossiers
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "dossiers_admin_select" on public.dossiers;
create policy "dossiers_admin_select" on public.dossiers
  for select to authenticated using (public.is_admin());

drop policy if exists "dossiers_ops_select" on public.dossiers;
create policy "dossiers_ops_select" on public.dossiers
  for select to authenticated using (public.is_ops());
drop policy if exists "dossiers_ops_insert" on public.dossiers;
create policy "dossiers_ops_insert" on public.dossiers
  for insert to authenticated with check (public.is_ops());
drop policy if exists "dossiers_ops_update" on public.dossiers;
create policy "dossiers_ops_update" on public.dossiers
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "dossiers_sales_select" on public.dossiers;
create policy "dossiers_sales_select" on public.dossiers
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = dossiers.prospect_id
        and (
          p.owner_id = auth.uid()
          or (
            p.territory = public.sales_territory()
            and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
          )
        )
    )
  );

-- ============================================================================
-- dossier_versions
-- ============================================================================
drop policy if exists "dossier_versions_founder_all" on public.dossier_versions;
create policy "dossier_versions_founder_all" on public.dossier_versions
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "dossier_versions_admin_select" on public.dossier_versions;
create policy "dossier_versions_admin_select" on public.dossier_versions
  for select to authenticated using (public.is_admin());

drop policy if exists "dossier_versions_ops_select" on public.dossier_versions;
create policy "dossier_versions_ops_select" on public.dossier_versions
  for select to authenticated using (public.is_ops());
drop policy if exists "dossier_versions_ops_insert" on public.dossier_versions;
create policy "dossier_versions_ops_insert" on public.dossier_versions
  for insert to authenticated with check (public.is_ops());

drop policy if exists "dossier_versions_sales_select" on public.dossier_versions;
create policy "dossier_versions_sales_select" on public.dossier_versions
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.dossiers d
      join public.prospects p on p.id = d.prospect_id
      where d.id = dossier_versions.dossier_id
        and (
          p.owner_id = auth.uid()
          or (
            p.territory = public.sales_territory()
            and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
          )
        )
    )
  );

-- ============================================================================
-- activities
-- ============================================================================
drop policy if exists "activities_founder_all" on public.activities;
create policy "activities_founder_all" on public.activities
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "activities_admin_select" on public.activities;
create policy "activities_admin_select" on public.activities
  for select to authenticated using (public.is_admin());

drop policy if exists "activities_ops_select" on public.activities;
create policy "activities_ops_select" on public.activities
  for select to authenticated using (public.is_ops());
drop policy if exists "activities_ops_insert" on public.activities;
create policy "activities_ops_insert" on public.activities
  for insert to authenticated with check (public.is_ops());

drop policy if exists "activities_sales_select" on public.activities;
create policy "activities_sales_select" on public.activities
  for select to authenticated
  using (
    public.is_sales()
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
drop policy if exists "activities_sales_insert" on public.activities;
create policy "activities_sales_insert" on public.activities
  for insert to authenticated
  with check (
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

-- ============================================================================
-- tasks
-- ============================================================================
drop policy if exists "tasks_founder_all" on public.tasks;
create policy "tasks_founder_all" on public.tasks
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "tasks_admin_select" on public.tasks;
create policy "tasks_admin_select" on public.tasks
  for select to authenticated using (public.is_admin());

drop policy if exists "tasks_ops_select" on public.tasks;
create policy "tasks_ops_select" on public.tasks
  for select to authenticated using (public.is_ops());
drop policy if exists "tasks_ops_insert" on public.tasks;
create policy "tasks_ops_insert" on public.tasks
  for insert to authenticated with check (public.is_ops());
drop policy if exists "tasks_ops_update" on public.tasks;
create policy "tasks_ops_update" on public.tasks
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "tasks_sales_select" on public.tasks;
create policy "tasks_sales_select" on public.tasks
  for select to authenticated
  using (public.is_sales() and assignee_id = auth.uid());
drop policy if exists "tasks_sales_insert" on public.tasks;
create policy "tasks_sales_insert" on public.tasks
  for insert to authenticated
  with check (public.is_sales() and assignee_id = auth.uid());
drop policy if exists "tasks_sales_update" on public.tasks;
create policy "tasks_sales_update" on public.tasks
  for update to authenticated
  using (public.is_sales() and assignee_id = auth.uid())
  with check (public.is_sales() and assignee_id = auth.uid());

-- ============================================================================
-- playbooks
-- ============================================================================
drop policy if exists "playbooks_founder_all" on public.playbooks;
create policy "playbooks_founder_all" on public.playbooks
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "playbooks_admin_select" on public.playbooks;
create policy "playbooks_admin_select" on public.playbooks
  for select to authenticated using (public.is_admin());

drop policy if exists "playbooks_ops_select" on public.playbooks;
create policy "playbooks_ops_select" on public.playbooks
  for select to authenticated using (public.is_ops());
drop policy if exists "playbooks_ops_insert" on public.playbooks;
create policy "playbooks_ops_insert" on public.playbooks
  for insert to authenticated with check (public.is_ops());
drop policy if exists "playbooks_ops_update" on public.playbooks;
create policy "playbooks_ops_update" on public.playbooks
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "playbooks_sales_select" on public.playbooks;
create policy "playbooks_sales_select" on public.playbooks
  for select to authenticated
  using (public.is_sales());

-- ============================================================================
-- enrichment_cache (founder rw, admin r, ops rw + DELETE)
-- ============================================================================
drop policy if exists "enrichment_cache_founder_all" on public.enrichment_cache;
create policy "enrichment_cache_founder_all" on public.enrichment_cache
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "enrichment_cache_admin_select" on public.enrichment_cache;
create policy "enrichment_cache_admin_select" on public.enrichment_cache
  for select to authenticated using (public.is_admin());

drop policy if exists "enrichment_cache_ops_all" on public.enrichment_cache;
create policy "enrichment_cache_ops_all" on public.enrichment_cache
  for all to authenticated
  using (public.is_ops()) with check (public.is_ops());

-- ============================================================================
-- enrichment_jobs (founder rw, admin r, ops rw)
-- ============================================================================
drop policy if exists "enrichment_jobs_founder_all" on public.enrichment_jobs;
create policy "enrichment_jobs_founder_all" on public.enrichment_jobs
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "enrichment_jobs_admin_select" on public.enrichment_jobs;
create policy "enrichment_jobs_admin_select" on public.enrichment_jobs
  for select to authenticated using (public.is_admin());

drop policy if exists "enrichment_jobs_ops_select" on public.enrichment_jobs;
create policy "enrichment_jobs_ops_select" on public.enrichment_jobs
  for select to authenticated using (public.is_ops());
drop policy if exists "enrichment_jobs_ops_insert" on public.enrichment_jobs;
create policy "enrichment_jobs_ops_insert" on public.enrichment_jobs
  for insert to authenticated with check (public.is_ops());
drop policy if exists "enrichment_jobs_ops_update" on public.enrichment_jobs;
create policy "enrichment_jobs_ops_update" on public.enrichment_jobs
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());
