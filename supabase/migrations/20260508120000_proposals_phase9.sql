-- Phase 9: proposals, versions, public share tokens, storage bucket proposals-media (QLE-69).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.proposal_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.proposal_language as enum ('de', 'en');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tables (proposals first without FK to versions; FK added after versions)
-- ---------------------------------------------------------------------------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  title text not null,
  blocks jsonb not null default '[]'::jsonb,
  language public.proposal_language not null default 'en',
  version int not null default 1,
  status public.proposal_status not null default 'draft',
  published_version_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_title_nonempty check (char_length(trim(title)) > 0)
);

create table if not exists public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  version int not null,
  blocks_diff jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users (id) on delete set null,
  unique (proposal_id, version)
);

alter table public.proposals
  drop constraint if exists proposals_published_version_id_fkey;

alter table public.proposals
  add constraint proposals_published_version_id_fkey
  foreign key (published_version_id) references public.proposal_versions (id) on delete set null;

create index if not exists proposals_prospect_id_idx on public.proposals (prospect_id);
create index if not exists proposals_status_idx on public.proposals (status);
create index if not exists proposal_versions_proposal_id_idx on public.proposal_versions (proposal_id);

create table if not exists public.proposal_share_tokens (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  token text not null unique,
  published_version_id uuid references public.proposal_versions (id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists proposal_share_tokens_proposal_id_idx
  on public.proposal_share_tokens (proposal_id);
create index if not exists proposal_share_tokens_token_idx
  on public.proposal_share_tokens (token);

drop trigger if exists tg_proposals_set_updated_at on public.proposals;
create trigger tg_proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: proposals (visibility follows prospect; mirror deals)
-- ---------------------------------------------------------------------------
alter table public.proposals enable row level security;
alter table public.proposal_versions enable row level security;
alter table public.proposal_share_tokens enable row level security;

grant select, insert, update, delete on public.proposals to authenticated, service_role;
grant select, insert, update, delete on public.proposal_versions to authenticated, service_role;
grant select, insert, update, delete on public.proposal_share_tokens to authenticated, service_role;
grant all on public.proposals to service_role;
grant all on public.proposal_versions to service_role;
grant all on public.proposal_share_tokens to service_role;

-- proposals
drop policy if exists "proposals_founder_all" on public.proposals;
create policy "proposals_founder_all" on public.proposals
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "proposals_admin_select" on public.proposals;
create policy "proposals_admin_select" on public.proposals
  for select to authenticated using (public.is_admin());

drop policy if exists "proposals_ops_select" on public.proposals;
create policy "proposals_ops_select" on public.proposals
  for select to authenticated using (public.is_ops());
drop policy if exists "proposals_ops_insert" on public.proposals;
create policy "proposals_ops_insert" on public.proposals
  for insert to authenticated with check (public.is_ops());
drop policy if exists "proposals_ops_update" on public.proposals;
create policy "proposals_ops_update" on public.proposals
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());
drop policy if exists "proposals_ops_delete" on public.proposals;
create policy "proposals_ops_delete" on public.proposals
  for delete to authenticated using (public.is_ops());

drop policy if exists "proposals_sales_select" on public.proposals;
create policy "proposals_sales_select" on public.proposals
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = proposals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_sales_insert" on public.proposals;
create policy "proposals_sales_insert" on public.proposals
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = proposals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_sales_update" on public.proposals;
create policy "proposals_sales_update" on public.proposals
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = proposals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = proposals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_sales_delete" on public.proposals;
create policy "proposals_sales_delete" on public.proposals
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = proposals.prospect_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

-- proposal_versions: same gate via parent proposal
drop policy if exists "proposal_versions_founder_all" on public.proposal_versions;
create policy "proposal_versions_founder_all" on public.proposal_versions
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "proposal_versions_admin_select" on public.proposal_versions;
create policy "proposal_versions_admin_select" on public.proposal_versions
  for select to authenticated using (public.is_admin());

drop policy if exists "proposal_versions_ops_select" on public.proposal_versions;
create policy "proposal_versions_ops_select" on public.proposal_versions
  for select to authenticated using (public.is_ops());
drop policy if exists "proposal_versions_ops_insert" on public.proposal_versions;
create policy "proposal_versions_ops_insert" on public.proposal_versions
  for insert to authenticated with check (public.is_ops());
drop policy if exists "proposal_versions_ops_update" on public.proposal_versions;
create policy "proposal_versions_ops_update" on public.proposal_versions
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());
drop policy if exists "proposal_versions_ops_delete" on public.proposal_versions;
create policy "proposal_versions_ops_delete" on public.proposal_versions
  for delete to authenticated using (public.is_ops());

drop policy if exists "proposal_versions_sales_select" on public.proposal_versions;
create policy "proposal_versions_sales_select" on public.proposal_versions
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_versions_sales_insert" on public.proposal_versions;
create policy "proposal_versions_sales_insert" on public.proposal_versions
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_versions_sales_update" on public.proposal_versions;
create policy "proposal_versions_sales_update" on public.proposal_versions
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_versions_sales_delete" on public.proposal_versions;
create policy "proposal_versions_sales_delete" on public.proposal_versions
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

-- proposal_share_tokens
drop policy if exists "proposal_share_tokens_founder_all" on public.proposal_share_tokens;
create policy "proposal_share_tokens_founder_all" on public.proposal_share_tokens
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "proposal_share_tokens_admin_select" on public.proposal_share_tokens;
create policy "proposal_share_tokens_admin_select" on public.proposal_share_tokens
  for select to authenticated using (public.is_admin());

drop policy if exists "proposal_share_tokens_ops_select" on public.proposal_share_tokens;
create policy "proposal_share_tokens_ops_select" on public.proposal_share_tokens
  for select to authenticated using (public.is_ops());
drop policy if exists "proposal_share_tokens_ops_insert" on public.proposal_share_tokens;
create policy "proposal_share_tokens_ops_insert" on public.proposal_share_tokens
  for insert to authenticated with check (public.is_ops());
drop policy if exists "proposal_share_tokens_ops_update" on public.proposal_share_tokens;
create policy "proposal_share_tokens_ops_update" on public.proposal_share_tokens
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());
drop policy if exists "proposal_share_tokens_ops_delete" on public.proposal_share_tokens;
create policy "proposal_share_tokens_ops_delete" on public.proposal_share_tokens
  for delete to authenticated using (public.is_ops());

drop policy if exists "proposal_share_tokens_sales_select" on public.proposal_share_tokens;
create policy "proposal_share_tokens_sales_select" on public.proposal_share_tokens
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_share_tokens_sales_insert" on public.proposal_share_tokens;
create policy "proposal_share_tokens_sales_insert" on public.proposal_share_tokens
  for insert to authenticated
  with check (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_share_tokens_sales_update" on public.proposal_share_tokens;
create policy "proposal_share_tokens_sales_update" on public.proposal_share_tokens
  for update to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposal_share_tokens_sales_delete" on public.proposal_share_tokens;
create policy "proposal_share_tokens_sales_delete" on public.proposal_share_tokens
  for delete to authenticated
  using (
    public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: private bucket + policies (path = {proposal_id}/{filename})
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proposals-media',
  'proposals-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "proposals_media_founder_all" on storage.objects;
create policy "proposals_media_founder_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_founder()
  )
  with check (
    bucket_id = 'proposals-media'
    and public.is_founder()
  );

drop policy if exists "proposals_media_admin_select" on storage.objects;
create policy "proposals_media_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_admin()
  );

drop policy if exists "proposals_media_ops_all" on storage.objects;
create policy "proposals_media_ops_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_ops()
  )
  with check (
    bucket_id = 'proposals-media'
    and public.is_ops()
  );

drop policy if exists "proposals_media_sales_select" on storage.objects;
create policy "proposals_media_sales_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = (storage.foldername(name))[1]::uuid
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_media_sales_insert" on storage.objects;
create policy "proposals_media_sales_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proposals-media'
    and public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = (storage.foldername(name))[1]::uuid
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_media_sales_update" on storage.objects;
create policy "proposals_media_sales_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = (storage.foldername(name))[1]::uuid
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  )
  with check (
    bucket_id = 'proposals-media'
    and public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = (storage.foldername(name))[1]::uuid
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );

drop policy if exists "proposals_media_sales_delete" on storage.objects;
create policy "proposals_media_sales_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'proposals-media'
    and public.is_sales()
    and exists (
      select 1
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = (storage.foldername(name))[1]::uuid
        and p.owner_id = auth.uid()
        and p.territory = public.sales_territory()
    )
  );
