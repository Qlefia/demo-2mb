-- user_has_workspace_access queried public.workspace_members under the invoker role.
-- RLS on workspace_members (self_read) uses a subquery on the same table → infinite recursion
-- whenever policies call user_has_workspace_access during a workspace_members scan.
-- Run membership check as definer so workspace_members is read with owner privileges (bypass RLS).

create or replace function public.user_has_workspace_access(target_ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_ws is not null
    and exists (
      select 1
      from public.workspace_members m
      where m.workspace_id = target_ws
        and m.user_id = auth.uid()
    );
$$;

revoke all on function public.user_has_workspace_access(uuid) from public;
grant execute on function public.user_has_workspace_access(uuid) to authenticated;
