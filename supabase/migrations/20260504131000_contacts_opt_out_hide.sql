-- Sales / ops / admin must not SELECT opted-out contacts (GDPR surface).

drop policy if exists "contacts_admin_select" on public.contacts;
create policy "contacts_admin_select" on public.contacts
  for select to authenticated using (
    public.is_admin()
    and contacts.opt_out_at is null
  );

drop policy if exists "contacts_ops_select" on public.contacts;
create policy "contacts_ops_select" on public.contacts
  for select to authenticated using (
    public.is_ops()
    and contacts.opt_out_at is null
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
        and p.territory = public.sales_territory()
        and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready')
    )
  );
