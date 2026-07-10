-- Studio MVP: workspaces, onboarding tables, tenant columns, restrictive RLS gates.
-- Default workspace id is fixed for deterministic backfill (single-tenant → multi-tenant bridge).

do $$ begin
  create type public.workspace_member_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_onboarding_status as enum ('draft', 'in_review', 'confirmed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_coaccess_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Core tenant tables
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_member_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members (user_id);

-- ---------------------------------------------------------------------------
-- Default workspace (deterministic id)
-- ---------------------------------------------------------------------------
insert into public.workspaces (id, name, slug, created_at, updated_at)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Default workspace',
  'default',
  now(),
  now()
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- accounts.workspace_id
-- ---------------------------------------------------------------------------
alter table public.accounts
  add column if not exists workspace_id uuid references public.workspaces (id);

update public.accounts
set workspace_id = '00000000-0000-4000-8000-000000000001'::uuid
where workspace_id is null;

alter table public.accounts
  alter column workspace_id set not null;

create index if not exists accounts_workspace_id_idx on public.accounts (workspace_id);

-- ---------------------------------------------------------------------------
-- playbooks.workspace_id + unique index
-- ---------------------------------------------------------------------------
alter table public.playbooks
  add column if not exists workspace_id uuid references public.workspaces (id);

update public.playbooks pb
set workspace_id = '00000000-0000-4000-8000-000000000001'::uuid
where pb.workspace_id is null;

alter table public.playbooks
  alter column workspace_id set not null;

drop index if exists public.playbooks_name_lang_version_unique;

create unique index if not exists playbooks_workspace_name_lang_version_unique
  on public.playbooks (workspace_id, name, language, version);

create index if not exists playbooks_workspace_id_idx on public.playbooks (workspace_id);

-- ---------------------------------------------------------------------------
-- organization_profile → PK(workspace_id)
-- ---------------------------------------------------------------------------
alter table public.organization_profile
  add column if not exists workspace_id uuid references public.workspaces (id);

update public.organization_profile op
set workspace_id = '00000000-0000-4000-8000-000000000001'::uuid
where op.workspace_id is null;

alter table public.organization_profile drop constraint if exists organization_profile_pkey;

alter table public.organization_profile drop column if exists singleton;

alter table public.organization_profile
  alter column workspace_id set not null;

alter table public.organization_profile
  add primary key (workspace_id);

-- Ensure row exists for default workspace
insert into public.organization_profile (workspace_id, legal_name, address_line, register_line)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'BEDEROV GmbH',
  'Kurfürstendamm 11, 10719 Berlin, Germany',
  'Commercial Register: HRB 92666'
)
on conflict (workspace_id) do nothing;

-- ---------------------------------------------------------------------------
-- Onboarding + co-access + sales Q&A
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_onboarding_state (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  status public.workspace_onboarding_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.workspace_onboarding_state (workspace_id, status)
values ('00000000-0000-4000-8000-000000000001'::uuid, 'draft')
on conflict (workspace_id) do nothing;

create table if not exists public.workspace_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_services_workspace_idx on public.workspace_services (workspace_id);

create table if not exists public.workspace_client_segments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  priority integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_client_segments_workspace_idx
  on public.workspace_client_segments (workspace_id);

create table if not exists public.workspace_offer_matrix (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  service_id uuid not null references public.workspace_services (id) on delete cascade,
  segment_id uuid not null references public.workspace_client_segments (id) on delete cascade,
  pitch text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, service_id, segment_id)
);

create index if not exists workspace_offer_matrix_segment_idx on public.workspace_offer_matrix (segment_id);

create table if not exists public.account_coaccess_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  note text,
  status public.account_coaccess_status not null default 'pending',
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_coaccess_workspace_idx on public.account_coaccess_requests (workspace_id);
create index if not exists account_coaccess_account_status_idx
  on public.account_coaccess_requests (account_id, status);

create table if not exists public.prospect_sales_qa (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  question text not null,
  answer text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_sales_qa_prospect_idx on public.prospect_sales_qa (prospect_id);

-- ---------------------------------------------------------------------------
-- Membership backfill: every auth user → default workspace (member)
-- ---------------------------------------------------------------------------
insert into public.workspace_members (workspace_id, user_id, role, created_at, updated_at)
select '00000000-0000-4000-8000-000000000001'::uuid, u.id, 'member'::public.workspace_member_role, now(), now()
from auth.users u
on conflict (workspace_id, user_id) do nothing;

-- Promote first user (lexicographic id) to owner if no owner yet
update public.workspace_members wm
set role = 'owner'::public.workspace_member_role
where wm.workspace_id = '00000000-0000-4000-8000-000000000001'::uuid
  and wm.user_id = (
    select u.id from auth.users u order by u.created_at asc nulls last, u.id asc limit 1
  )
  and not exists (
    select 1 from public.workspace_members o
    where o.workspace_id = wm.workspace_id and o.role = 'owner'::public.workspace_member_role
  );

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse global trigger fn)
-- ---------------------------------------------------------------------------
drop trigger if exists tg_workspaces_set_updated_at on public.workspaces;
create trigger tg_workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_workspace_members_set_updated_at on public.workspace_members;
create trigger tg_workspace_members_set_updated_at
  before update on public.workspace_members
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_workspace_onboarding_state_set_updated_at on public.workspace_onboarding_state;
create trigger tg_workspace_onboarding_state_set_updated_at
  before update on public.workspace_onboarding_state
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_workspace_services_set_updated_at on public.workspace_services;
create trigger tg_workspace_services_set_updated_at
  before update on public.workspace_services
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_workspace_client_segments_set_updated_at on public.workspace_client_segments;
create trigger tg_workspace_client_segments_set_updated_at
  before update on public.workspace_client_segments
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_workspace_offer_matrix_set_updated_at on public.workspace_offer_matrix;
create trigger tg_workspace_offer_matrix_set_updated_at
  before update on public.workspace_offer_matrix
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_account_coaccess_requests_set_updated_at on public.account_coaccess_requests;
create trigger tg_account_coaccess_requests_set_updated_at
  before update on public.account_coaccess_requests
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_prospect_sales_qa_set_updated_at on public.prospect_sales_qa;
create trigger tg_prospect_sales_qa_set_updated_at
  before update on public.prospect_sales_qa
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_organization_profile_set_updated_at on public.organization_profile;
create trigger tg_organization_profile_set_updated_at
  before update on public.organization_profile
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: tenant gate (STABLE; SECURITY INVOKER default)
-- ---------------------------------------------------------------------------
create or replace function public.user_has_workspace_access(target_ws uuid)
returns boolean
language sql
stable
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

-- ---------------------------------------------------------------------------
-- Restrictive RLS: AND with existing permissive role policies
-- ---------------------------------------------------------------------------
drop policy if exists accounts_workspace_restrictive on public.accounts;
create policy accounts_workspace_restrictive on public.accounts
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(accounts.workspace_id))
  with check (public.user_has_workspace_access(accounts.workspace_id));

drop policy if exists contacts_workspace_restrictive on public.contacts;
create policy contacts_workspace_restrictive on public.contacts
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = contacts.account_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = contacts.account_id
    ))
  );

drop policy if exists prospects_workspace_restrictive on public.prospects;
create policy prospects_workspace_restrictive on public.prospects
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = prospects.account_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = prospects.account_id
    ))
  );

drop policy if exists triggers_workspace_restrictive on public.triggers;
create policy triggers_workspace_restrictive on public.triggers
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = triggers.account_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id from public.accounts a where a.id = triggers.account_id
    ))
  );

drop policy if exists dossiers_workspace_restrictive on public.dossiers;
create policy dossiers_workspace_restrictive on public.dossiers
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = dossiers.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = dossiers.prospect_id
    ))
  );

drop policy if exists dossier_versions_workspace_restrictive on public.dossier_versions;
create policy dossier_versions_workspace_restrictive on public.dossier_versions
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.dossiers d
      join public.prospects p on p.id = d.prospect_id
      join public.accounts a on a.id = p.account_id
      where d.id = dossier_versions.dossier_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.dossiers d
      join public.prospects p on p.id = d.prospect_id
      join public.accounts a on a.id = p.account_id
      where d.id = dossier_versions.dossier_id
    ))
  );

drop policy if exists activities_workspace_restrictive on public.activities;
create policy activities_workspace_restrictive on public.activities
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = activities.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = activities.prospect_id
    ))
  );

drop policy if exists tasks_workspace_restrictive on public.tasks;
create policy tasks_workspace_restrictive on public.tasks
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = tasks.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = tasks.prospect_id
    ))
  );

drop policy if exists playbooks_workspace_restrictive on public.playbooks;
create policy playbooks_workspace_restrictive on public.playbooks
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(playbooks.workspace_id))
  with check (public.user_has_workspace_access(playbooks.workspace_id));

drop policy if exists enrichment_jobs_workspace_restrictive on public.enrichment_jobs;
create policy enrichment_jobs_workspace_restrictive on public.enrichment_jobs
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = enrichment_jobs.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = enrichment_jobs.prospect_id
    ))
  );

drop policy if exists deals_workspace_restrictive on public.deals;
create policy deals_workspace_restrictive on public.deals
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = deals.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = deals.prospect_id
    ))
  );

drop policy if exists proposals_workspace_restrictive on public.proposals;
create policy proposals_workspace_restrictive on public.proposals
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = proposals.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = proposals.prospect_id
    ))
  );

drop policy if exists proposal_versions_workspace_restrictive on public.proposal_versions;
create policy proposal_versions_workspace_restrictive on public.proposal_versions
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      join public.accounts a on a.id = p.account_id
      where pr.id = proposal_versions.proposal_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      join public.accounts a on a.id = p.account_id
      where pr.id = proposal_versions.proposal_id
    ))
  );

drop policy if exists proposal_share_tokens_workspace_restrictive on public.proposal_share_tokens;
create policy proposal_share_tokens_workspace_restrictive on public.proposal_share_tokens
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      join public.accounts a on a.id = p.account_id
      where pr.id = proposal_share_tokens.proposal_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      join public.accounts a on a.id = p.account_id
      where pr.id = proposal_share_tokens.proposal_id
    ))
  );

drop policy if exists organization_profile_workspace_restrictive on public.organization_profile;
create policy organization_profile_workspace_restrictive on public.organization_profile
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(organization_profile.workspace_id))
  with check (public.user_has_workspace_access(organization_profile.workspace_id));

-- ---------------------------------------------------------------------------
-- RLS on new tenant tables
-- ---------------------------------------------------------------------------
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_onboarding_state enable row level security;
alter table public.workspace_services enable row level security;
alter table public.workspace_client_segments enable row level security;
alter table public.workspace_offer_matrix enable row level security;
alter table public.account_coaccess_requests enable row level security;
alter table public.prospect_sales_qa enable row level security;

grant select on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.workspace_onboarding_state to authenticated;
grant select, insert, update, delete on public.workspace_services to authenticated;
grant select, insert, update, delete on public.workspace_client_segments to authenticated;
grant select, insert, update, delete on public.workspace_offer_matrix to authenticated;
grant select, insert, update, delete on public.account_coaccess_requests to authenticated;
grant select, insert, update, delete on public.prospect_sales_qa to authenticated;

grant all on public.workspaces to service_role;
grant all on public.workspace_members to service_role;
grant all on public.workspace_onboarding_state to service_role;
grant all on public.workspace_services to service_role;
grant all on public.workspace_client_segments to service_role;
grant all on public.workspace_offer_matrix to service_role;
grant all on public.account_coaccess_requests to service_role;
grant all on public.prospect_sales_qa to service_role;

drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_member_select on public.workspaces
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspaces.id and m.user_id = auth.uid()
    )
  );

drop policy if exists workspace_members_self_read on public.workspace_members;
create policy workspace_members_self_read on public.workspace_members
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id and m.user_id = auth.uid()
    )
  );

drop policy if exists workspace_onboarding_rw on public.workspace_onboarding_state;
create policy workspace_onboarding_rw on public.workspace_onboarding_state
  for all to authenticated
  using (public.user_has_workspace_access(workspace_onboarding_state.workspace_id))
  with check (public.user_has_workspace_access(workspace_onboarding_state.workspace_id));

drop policy if exists workspace_services_rw on public.workspace_services;
create policy workspace_services_rw on public.workspace_services
  for all to authenticated
  using (public.user_has_workspace_access(workspace_services.workspace_id))
  with check (public.user_has_workspace_access(workspace_services.workspace_id));

drop policy if exists workspace_segments_rw on public.workspace_client_segments;
create policy workspace_segments_rw on public.workspace_client_segments
  for all to authenticated
  using (public.user_has_workspace_access(workspace_client_segments.workspace_id))
  with check (public.user_has_workspace_access(workspace_client_segments.workspace_id));

drop policy if exists workspace_offer_matrix_rw on public.workspace_offer_matrix;
create policy workspace_offer_matrix_rw on public.workspace_offer_matrix
  for all to authenticated
  using (public.user_has_workspace_access(workspace_offer_matrix.workspace_id))
  with check (public.user_has_workspace_access(workspace_offer_matrix.workspace_id));

drop policy if exists account_coaccess_rw on public.account_coaccess_requests;
create policy account_coaccess_rw on public.account_coaccess_requests
  for all to authenticated
  using (public.user_has_workspace_access(account_coaccess_requests.workspace_id))
  with check (public.user_has_workspace_access(account_coaccess_requests.workspace_id));

drop policy if exists prospect_sales_qa_rw on public.prospect_sales_qa;
create policy prospect_sales_qa_rw on public.prospect_sales_qa
  for all to authenticated
  using (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = prospect_sales_qa.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select a.workspace_id
      from public.prospects p
      join public.accounts a on a.id = p.account_id
      where p.id = prospect_sales_qa.prospect_id
    ))
  );
