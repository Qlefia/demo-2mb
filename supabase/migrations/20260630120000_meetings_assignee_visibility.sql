-- Meetings: assignee + visibility (calendar shows only assigned / organiser / prospect owner).

alter table public.meetings
  add column if not exists assignee_id uuid references auth.users (id) on delete cascade;

update public.meetings
set assignee_id = organiser_id
where assignee_id is null;

alter table public.meetings
  alter column assignee_id set not null;

create index if not exists meetings_assignee_starts_idx on public.meetings (assignee_id, starts_at);
create index if not exists meetings_organiser_starts_idx on public.meetings (organiser_id, starts_at);

-- Replace broad sales SELECT with assignee / organiser / prospect-owner visibility.
drop policy if exists "meetings_sales_select" on public.meetings;
create policy "meetings_sales_select" on public.meetings
  for select to authenticated
  using (
    public.is_sales()
    and (
      meetings.assignee_id = auth.uid()
      or meetings.organiser_id = auth.uid()
      or exists (
        select 1 from public.prospects p
        where p.id = meetings.prospect_id
          and p.owner_id = auth.uid()
          and p.territory = public.sales_territory()
      )
    )
  );

-- Sales may create/update/delete only when they can access the prospect (unchanged shape).
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
    and (
      meetings.assignee_id = auth.uid()
      or meetings.organiser_id = auth.uid()
      or exists (
        select 1 from public.prospects p
        where p.id = meetings.prospect_id
          and p.owner_id = auth.uid()
          and p.territory = public.sales_territory()
      )
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
    and (
      meetings.organiser_id = auth.uid()
      or exists (
        select 1 from public.prospects p
        where p.id = meetings.prospect_id
          and p.owner_id = auth.uid()
          and p.territory = public.sales_territory()
      )
    )
  );

comment on column public.meetings.assignee_id is
  'CRM seat responsible for the meeting. Calendar default view filters to assignee_id or organiser_id = auth.uid().';
