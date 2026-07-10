-- #63: Prospect-scoped meetings (manual CRM calendar; external sync via external_source/id later).

create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled');

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  organiser_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  status public.meeting_status not null default 'scheduled',
  notes text,
  external_source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetings_title_nonempty check (char_length(trim(title)) > 0),
  constraint meetings_ends_after_start check (ends_at is null or ends_at > starts_at)
);

create index meetings_prospect_id_idx on public.meetings (prospect_id);
create index meetings_starts_at_idx on public.meetings (starts_at);
create index meetings_prospect_status_starts_idx on public.meetings (prospect_id, status, starts_at);

alter table public.meetings enable row level security;

grant select, insert, update, delete on public.meetings to authenticated;
grant all on public.meetings to service_role;

drop trigger if exists tg_meetings_set_updated_at on public.meetings;
create trigger tg_meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.tg_set_updated_at();

-- Workspace scope (same pattern as deals)
drop policy if exists meetings_workspace_restrictive on public.meetings;
create policy meetings_workspace_restrictive on public.meetings
  as restrictive
  for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = meetings.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = meetings.prospect_id
    ))
  );

drop policy if exists "meetings_founder_all" on public.meetings;
create policy "meetings_founder_all" on public.meetings
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "meetings_admin_select" on public.meetings;
create policy "meetings_admin_select" on public.meetings
  for select to authenticated using (public.is_admin());

drop policy if exists "meetings_ops_select" on public.meetings;
create policy "meetings_ops_select" on public.meetings
  for select to authenticated using (public.is_ops());

drop policy if exists "meetings_ops_insert" on public.meetings;
create policy "meetings_ops_insert" on public.meetings
  for insert to authenticated with check (public.is_ops());

drop policy if exists "meetings_ops_update" on public.meetings;
create policy "meetings_ops_update" on public.meetings
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "meetings_ops_delete" on public.meetings;
create policy "meetings_ops_delete" on public.meetings
  for delete to authenticated using (public.is_ops());

drop policy if exists "meetings_sales_select" on public.meetings;
create policy "meetings_sales_select" on public.meetings
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = meetings.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "meetings_sales_insert" on public.meetings;
create policy "meetings_sales_insert" on public.meetings
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = meetings.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "meetings_sales_update" on public.meetings;
create policy "meetings_sales_update" on public.meetings
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = meetings.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = meetings.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "meetings_sales_delete" on public.meetings;
create policy "meetings_sales_delete" on public.meetings
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = meetings.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

comment on table public.meetings is
  'Scheduled touchpoints on a prospect (discovery, follow-up). Cal.com/Zoom wire-up via external_source + external_id.';
