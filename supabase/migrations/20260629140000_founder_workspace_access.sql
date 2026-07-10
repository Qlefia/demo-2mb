-- Founders and admins must reach default-workspace rows without a workspace_members seat
-- (bootstrap founder often has role in JWT only).

create or replace function public.user_has_workspace_access(target_ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_ws is not null
    and (
      public.is_founder()
      or public.is_admin()
      or exists (
        select 1
        from public.workspace_members m
        where m.workspace_id = target_ws
          and m.user_id = auth.uid()
      )
    );
$$;

revoke all on function public.user_has_workspace_access(uuid) from public;
grant execute on function public.user_has_workspace_access(uuid) to authenticated;
