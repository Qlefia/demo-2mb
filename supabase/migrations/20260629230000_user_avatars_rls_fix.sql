-- Fix user-avatars storage RLS (uuid compare + select for client-side reads).

drop policy if exists user_avatars_insert on storage.objects;
create policy user_avatars_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

drop policy if exists user_avatars_update on storage.objects;
create policy user_avatars_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  )
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

drop policy if exists user_avatars_delete on storage.objects;
create policy user_avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

drop policy if exists user_avatars_select on storage.objects;
create policy user_avatars_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );
