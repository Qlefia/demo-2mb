-- Daily usage counters per external enrichment provider.

create table public.provider_quota (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  bucket_date date not null,
  used integer not null default 0 check (used >= 0),
  limit_cap integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_quota_provider_bucket_unique unique (provider, bucket_date)
);

create index provider_quota_bucket_date_idx on public.provider_quota (bucket_date);

alter table public.provider_quota enable row level security;

create trigger tg_provider_quota_set_updated_at
  before update on public.provider_quota
  for each row execute function public.tg_set_updated_at();

drop policy if exists "provider_quota_founder_all" on public.provider_quota;
create policy "provider_quota_founder_all" on public.provider_quota
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "provider_quota_admin_select" on public.provider_quota;
create policy "provider_quota_admin_select" on public.provider_quota
  for select to authenticated using (public.is_admin());

drop policy if exists "provider_quota_ops_all" on public.provider_quota;
create policy "provider_quota_ops_all" on public.provider_quota
  for all to authenticated
  using (public.is_ops()) with check (public.is_ops());

grant select, insert, update, delete on public.provider_quota to authenticated;
grant all on public.provider_quota to service_role;
