-- Company offices + billing profile on accounts (CRM company card → offers/invoices).

alter table public.accounts
  add column if not exists offices jsonb not null default '[]'::jsonb,
  add column if not exists billing jsonb not null default '{}'::jsonb;

comment on column public.accounts.offices is
  'CRM company offices: [{ id, label, kind, address, phones[], contact, isPrimary }]';
comment on column public.accounts.billing is
  'CRM company billing profile for offers/invoices (legal name, VAT, billing address, payment terms).';

-- Sales may update account company profile when they own a late-stage prospect on that account.
drop policy if exists "accounts_sales_update" on public.accounts;
create policy "accounts_sales_update" on public.accounts
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.prospects p
      where p.account_id = accounts.id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
        and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready'::public.prospect_stage)
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1
      from public.prospects p
      where p.account_id = accounts.id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
        and public.stage_rank(p.stage) >= public.stage_rank('dossier_ready'::public.prospect_stage)
    )
  );
