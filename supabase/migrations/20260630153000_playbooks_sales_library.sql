-- Sales seats need the full workspace playbook library for assignment and call scripts,
-- not only playbooks already linked to their prospects.

drop policy if exists "playbooks_sales_select" on public.playbooks;
create policy "playbooks_sales_select" on public.playbooks
  for select to authenticated
  using (
    public.is_sales()
    and public.user_has_workspace_access(playbooks.workspace_id)
  );

-- Sales can author outreach scripts in their workspace (ops/founder policies unchanged).
drop policy if exists "playbooks_sales_insert" on public.playbooks;
create policy "playbooks_sales_insert" on public.playbooks
  for insert to authenticated
  with check (
    public.is_sales()
    and public.user_has_workspace_access(playbooks.workspace_id)
  );

drop policy if exists "playbooks_sales_update" on public.playbooks;
create policy "playbooks_sales_update" on public.playbooks
  for update to authenticated
  using (
    public.is_sales()
    and public.user_has_workspace_access(playbooks.workspace_id)
  )
  with check (
    public.is_sales()
    and public.user_has_workspace_access(playbooks.workspace_id)
  );
