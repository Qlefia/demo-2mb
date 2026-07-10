-- #64 Phase 1: client_projects — commercial unit between prospect and offers/invoices.

create type public.client_project_status as enum (
  'discovered',
  'qualified',
  'offer_sent',
  'offer_accepted',
  'in_delivery',
  'completed',
  'offer_declined',
  'cancelled'
);

create table public.client_projects (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text,
  status public.client_project_status not null default 'discovered',
  currency text not null default 'EUR',
  estimated_value numeric(14, 2),
  accepted_offer_id uuid,
  deal_id uuid,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason public.lost_reason,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_projects_title_nonempty check (char_length(trim(title)) > 0)
);

create index client_projects_prospect_id_idx on public.client_projects (prospect_id);
create index client_projects_workspace_id_idx on public.client_projects (workspace_id);
create index client_projects_status_idx on public.client_projects (status);

alter table public.proposals
  add column if not exists project_id uuid references public.client_projects (id) on delete set null;

create index if not exists proposals_project_id_idx on public.proposals (project_id);

alter table public.deals
  add column if not exists project_id uuid references public.client_projects (id) on delete set null;

create index if not exists deals_project_id_idx on public.deals (project_id);

alter table public.client_projects
  add constraint client_projects_accepted_offer_fk
    foreign key (accepted_offer_id) references public.proposals (id) on delete set null;

alter table public.client_projects
  add constraint client_projects_deal_fk
    foreign key (deal_id) references public.deals (id) on delete set null;

alter table public.client_projects enable row level security;

grant select, insert, update, delete on public.client_projects to authenticated;
grant all on public.client_projects to service_role;

drop trigger if exists tg_client_projects_set_updated_at on public.client_projects;
create trigger tg_client_projects_set_updated_at
  before update on public.client_projects
  for each row execute function public.tg_set_updated_at();

drop policy if exists client_projects_workspace_restrictive on public.client_projects;
create policy client_projects_workspace_restrictive on public.client_projects
  as restrictive
  for all to authenticated
  using (
    public.user_has_workspace_access(client_projects.workspace_id)
  )
  with check (
    public.user_has_workspace_access(client_projects.workspace_id)
  );

drop policy if exists "client_projects_founder_all" on public.client_projects;
create policy "client_projects_founder_all" on public.client_projects
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "client_projects_admin_select" on public.client_projects;
create policy "client_projects_admin_select" on public.client_projects
  for select to authenticated using (public.is_admin());

drop policy if exists "client_projects_ops_select" on public.client_projects;
create policy "client_projects_ops_select" on public.client_projects
  for select to authenticated using (public.is_ops());

drop policy if exists "client_projects_ops_insert" on public.client_projects;
create policy "client_projects_ops_insert" on public.client_projects
  for insert to authenticated with check (public.is_ops());

drop policy if exists "client_projects_ops_update" on public.client_projects;
create policy "client_projects_ops_update" on public.client_projects
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "client_projects_ops_delete" on public.client_projects;
create policy "client_projects_ops_delete" on public.client_projects
  for delete to authenticated using (public.is_ops());

drop policy if exists "client_projects_sales_select" on public.client_projects;
create policy "client_projects_sales_select" on public.client_projects
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = client_projects.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "client_projects_sales_insert" on public.client_projects;
create policy "client_projects_sales_insert" on public.client_projects
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = client_projects.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "client_projects_sales_update" on public.client_projects;
create policy "client_projects_sales_update" on public.client_projects
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = client_projects.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = client_projects.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "client_projects_sales_delete" on public.client_projects;
create policy "client_projects_sales_delete" on public.client_projects
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = client_projects.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

-- Backfill: one client_project per existing offer without project_id.
do $$
declare
  r record;
  new_project_id uuid;
begin
  for r in
    select pr.id as offer_id,
           pr.prospect_id,
           pr.project_name,
           pr.title,
           p.workspace_id
    from public.proposals pr
    join public.prospects p on p.id = pr.prospect_id
    where pr.document_kind = 'offer'
      and pr.project_id is null
  loop
    insert into public.client_projects (prospect_id, workspace_id, title, status)
    values (
      r.prospect_id,
      r.workspace_id,
      coalesce(nullif(trim(r.project_name), ''), r.title),
      'discovered'
    )
    returning id into new_project_id;

    update public.proposals
    set project_id = new_project_id
    where id = r.offer_id;
  end loop;
end $$;

comment on table public.client_projects is
  'Commercial project scoped to a prospect — offers, deals, and future invoices attach here.';
