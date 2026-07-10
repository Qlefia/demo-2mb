-- Studio workspace media (General + Sales images) — public read, workspace-scoped write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-studio',
  'workspace-studio',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists workspace_studio_insert on storage.objects;
create policy workspace_studio_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'workspace-studio'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists workspace_studio_update on storage.objects;
create policy workspace_studio_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'workspace-studio'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'workspace-studio'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists workspace_studio_delete on storage.objects;
create policy workspace_studio_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'workspace-studio'
    and public.user_has_workspace_access(((storage.foldername(name))[1])::uuid)
  );
