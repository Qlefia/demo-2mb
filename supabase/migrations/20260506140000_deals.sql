-- QLE-47: lightweight deals/opportunities tied to a prospect (visibility follows prospects).

create type public.deal_stage as enum ('open', 'won', 'lost');

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  title text not null,
  value numeric(14, 2),
  currency text not null default 'EUR',
  stage public.deal_stage not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_title_nonempty check (char_length(trim(title)) > 0)
);

create index deals_prospect_id_idx on public.deals (prospect_id);

alter table public.deals enable row level security;

grant select, insert, update, delete on public.deals to authenticated;
grant all on public.deals to service_role;

drop trigger if exists tg_deals_set_updated_at on public.deals;
create trigger tg_deals_set_updated_at
  before update on public.deals
  for each row execute function public.tg_set_updated_at();

drop policy if exists "deals_founder_all" on public.deals;
create policy "deals_founder_all" on public.deals
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "deals_admin_select" on public.deals;
create policy "deals_admin_select" on public.deals
  for select to authenticated using (public.is_admin());

drop policy if exists "deals_ops_select" on public.deals;
create policy "deals_ops_select" on public.deals
  for select to authenticated using (public.is_ops());

drop policy if exists "deals_ops_insert" on public.deals;
create policy "deals_ops_insert" on public.deals
  for insert to authenticated with check (public.is_ops());

drop policy if exists "deals_ops_update" on public.deals;
create policy "deals_ops_update" on public.deals
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "deals_ops_delete" on public.deals;
create policy "deals_ops_delete" on public.deals
  for delete to authenticated using (public.is_ops());

drop policy if exists "deals_sales_select" on public.deals;
create policy "deals_sales_select" on public.deals
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = deals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "deals_sales_insert" on public.deals;
create policy "deals_sales_insert" on public.deals
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = deals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "deals_sales_update" on public.deals;
create policy "deals_sales_update" on public.deals
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = deals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = deals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "deals_sales_delete" on public.deals;
create policy "deals_sales_delete" on public.deals
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = deals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );
