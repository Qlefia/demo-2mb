-- Sales seats: only prospects owned by current user AND matching their territory.
-- Removes the previous "territory pool" visibility (dossier_ready+ unassigned).

drop policy if exists "accounts_sales_select" on public.accounts;
create policy "accounts_sales_select" on public.accounts
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.account_id = accounts.id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "contacts_sales_select" on public.contacts;
create policy "contacts_sales_select" on public.contacts
  for select to authenticated
  using (
    public.is_sales()
    and contacts.opt_out_at is null
    and exists (
      select 1 from public.prospects p
      where p.account_id = contacts.account_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "prospects_sales_select" on public.prospects;
create policy "prospects_sales_select" on public.prospects
  for select to authenticated
  using (
    public.is_sales()
    and owner_id = auth.uid()
    and territory = public.sales_territory()
  );

drop policy if exists "prospects_sales_update" on public.prospects;
create policy "prospects_sales_update" on public.prospects
  for update to authenticated
  using (
    public.is_sales()
    and owner_id = auth.uid()
    and territory = public.sales_territory()
  )
  with check (
    public.is_sales()
    and owner_id = auth.uid()
    and territory = public.sales_territory()
  );

drop policy if exists "triggers_sales_select" on public.triggers;
create policy "triggers_sales_select" on public.triggers
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.prospects p
      where p.account_id = triggers.account_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "dossiers_sales_select" on public.dossiers;
create policy "dossiers_sales_select" on public.dossiers
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = dossiers.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

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
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "activities_sales_select" on public.activities;
create policy "activities_sales_select" on public.activities
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = activities.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
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
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "activities_sales_update" on public.activities;
create policy "activities_sales_update" on public.activities
  for update to authenticated
  using (
    public.is_sales()
    and actor_id = auth.uid()
    and exists (
      select 1 from public.prospects p
      where p.id = activities.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
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
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

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
          and p.owner_id = auth.uid()
          and p.territory = public.sales_territory()
      )
      or exists (
        select 1
        from public.dossiers d
        join public.prospects p on p.id = d.prospect_id
        where d.suggested_playbook_id = playbooks.id
          and p.owner_id = auth.uid()
          and p.territory = public.sales_territory()
      )
    )
  );
