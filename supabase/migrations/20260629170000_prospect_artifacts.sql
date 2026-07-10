-- Prospect research artifacts (folders, screenshots, links, notes) + private storage bucket.

do $$ begin
  create type public.prospect_artifact_kind as enum ('folder', 'image', 'link', 'note');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.prospect_artifacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  parent_id uuid references public.prospect_artifacts (id) on delete cascade,
  kind public.prospect_artifact_kind not null,
  title text not null,
  body text,
  url text,
  storage_path text,
  mime_type text,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_artifacts_prospect_idx on public.prospect_artifacts (prospect_id);
create index if not exists prospect_artifacts_parent_idx on public.prospect_artifacts (parent_id);
create index if not exists prospect_artifacts_prospect_parent_idx
  on public.prospect_artifacts (prospect_id, parent_id);

drop trigger if exists tg_prospect_artifacts_set_updated_at on public.prospect_artifacts;
create trigger tg_prospect_artifacts_set_updated_at
  before update on public.prospect_artifacts
  for each row execute function public.tg_set_updated_at();

alter table public.prospect_artifacts enable row level security;

grant select, insert, update, delete on public.prospect_artifacts to authenticated;
grant all on public.prospect_artifacts to service_role;

drop policy if exists prospect_artifacts_rw on public.prospect_artifacts;
create policy prospect_artifacts_rw on public.prospect_artifacts
  for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = prospect_artifacts.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = prospect_artifacts.prospect_id
    ))
  );

-- Private bucket: workspace_id/prospect_id/artifact_id.webp
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prospect-artifacts',
  'prospect-artifacts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists prospect_artifacts_storage_insert on storage.objects;
create policy prospect_artifacts_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'prospect-artifacts'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists prospect_artifacts_storage_update on storage.objects;
create policy prospect_artifacts_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'prospect-artifacts'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'prospect-artifacts'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists prospect_artifacts_storage_delete on storage.objects;
create policy prospect_artifacts_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'prospect-artifacts'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists prospect_artifacts_storage_select on storage.objects;
create policy prospect_artifacts_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'prospect-artifacts'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );
