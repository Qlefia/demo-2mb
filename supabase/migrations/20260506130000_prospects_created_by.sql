-- QLE-45: track which auth user created the prospect row.
alter table public.prospects
  add column if not exists created_by uuid references auth.users (id) on delete set null;

comment on column public.prospects.created_by is
  'User who created this prospect (insert). Distinct from owner (assignment).';

create index if not exists prospects_created_by_idx on public.prospects (created_by);

-- Best-effort backfill when the row had an owner (unknown true creator for legacy data).
update public.prospects
set created_by = owner_id
where created_by is null
  and owner_id is not null;

-- Ops intake: creator must be the current user (no spoofing another user id).
drop policy if exists "prospects_ops_insert" on public.prospects;
create policy "prospects_ops_insert" on public.prospects
  for insert to authenticated
  with check (
    public.is_ops()
    and (created_by is null or created_by = auth.uid())
  );
