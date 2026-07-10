-- Dashboard favorites (per-user prospect pins) + signal-scan trigger insert policy.

create table if not exists public.user_prospect_pins (
  user_id uuid not null references auth.users (id) on delete cascade,
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, prospect_id)
);

create index if not exists user_prospect_pins_user_sort_idx
  on public.user_prospect_pins (user_id, sort_order);

alter table public.user_prospect_pins enable row level security;

drop policy if exists user_prospect_pins_self on public.user_prospect_pins;
create policy user_prospect_pins_self on public.user_prospect_pins
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.prospects p where p.id = prospect_id
    )
  );

grant select, insert, update, delete on public.user_prospect_pins to authenticated;
grant all on public.user_prospect_pins to service_role;

alter publication supabase_realtime add table public.user_prospect_pins;

-- Allow authenticated users to insert news_scan triggers for prospects they can see (RLS on prospects subquery).
drop policy if exists triggers_signal_scan_insert on public.triggers;
create policy triggers_signal_scan_insert on public.triggers
  for insert to authenticated
  with check (
    type = 'news_scan'
    and prospect_id is not null
    and exists (
      select 1 from public.prospects p where p.id = prospect_id
    )
  );
