-- Workspace studio settings (General + Sales) — JSON document per tenant with Realtime.

create table if not exists public.workspace_studio_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  general jsonb not null default '{}'::jsonb,
  sales jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.workspace_studio_settings (workspace_id, general, sales)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  '{}'::jsonb,
  '{}'::jsonb
)
on conflict (workspace_id) do nothing;

drop trigger if exists tg_workspace_studio_settings_set_updated_at on public.workspace_studio_settings;
create trigger tg_workspace_studio_settings_set_updated_at
  before update on public.workspace_studio_settings
  for each row execute function public.tg_set_updated_at();

alter table public.workspace_studio_settings enable row level security;

grant select, insert, update, delete on public.workspace_studio_settings to authenticated;
grant all on public.workspace_studio_settings to service_role;

drop policy if exists workspace_studio_settings_rw on public.workspace_studio_settings;
create policy workspace_studio_settings_rw on public.workspace_studio_settings
  for all to authenticated
  using (public.user_has_workspace_access(workspace_studio_settings.workspace_id))
  with check (public.user_has_workspace_access(workspace_studio_settings.workspace_id));

-- Live updates for all studio settings clients in the same workspace.
alter publication supabase_realtime add table public.workspace_studio_settings;
