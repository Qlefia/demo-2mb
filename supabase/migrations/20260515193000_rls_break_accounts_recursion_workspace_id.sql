-- Break RLS infinite recursion on public.accounts:
-- accounts_sales_select probes prospects; prospects_workspace_restrictive probed accounts.
-- Denormalize workspace_id onto prospects/contacts/triggers and rewrite restrictive policies
-- to avoid selecting accounts from inside other-table policies.

-- ---------------------------------------------------------------------------
-- 1) Columns + backfill + NOT NULL
-- ---------------------------------------------------------------------------
alter table public.prospects add column if not exists workspace_id uuid references public.workspaces (id);
alter table public.contacts add column if not exists workspace_id uuid references public.workspaces (id);
alter table public.triggers add column if not exists workspace_id uuid references public.workspaces (id);

update public.prospects p
set workspace_id = a.workspace_id
from public.accounts a
where a.id = p.account_id
  and p.workspace_id is null;

update public.contacts c
set workspace_id = a.workspace_id
from public.accounts a
where a.id = c.account_id
  and c.workspace_id is null;

update public.triggers t
set workspace_id = a.workspace_id
from public.accounts a
where a.id = t.account_id
  and t.workspace_id is null;

alter table public.prospects alter column workspace_id set not null;
alter table public.contacts alter column workspace_id set not null;
alter table public.triggers alter column workspace_id set not null;

create index if not exists prospects_workspace_id_idx on public.prospects (workspace_id);
create index if not exists contacts_workspace_id_idx on public.contacts (workspace_id);
create index if not exists triggers_workspace_id_idx on public.triggers (workspace_id);

-- ---------------------------------------------------------------------------
-- 2) Keep workspace_id in sync with account_id / account moves
-- ---------------------------------------------------------------------------
create or replace function public.tg_sync_prospect_workspace_from_account()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  select a.workspace_id into strict new.workspace_id
  from public.accounts a
  where a.id = new.account_id;
  return new;
end;
$$;

drop trigger if exists tg_prospects_sync_workspace on public.prospects;
create trigger tg_prospects_sync_workspace
  before insert or update of account_id on public.prospects
  for each row execute function public.tg_sync_prospect_workspace_from_account();

create or replace function public.tg_sync_contact_workspace_from_account()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  select a.workspace_id into strict new.workspace_id
  from public.accounts a
  where a.id = new.account_id;
  return new;
end;
$$;

drop trigger if exists tg_contacts_sync_workspace on public.contacts;
create trigger tg_contacts_sync_workspace
  before insert or update of account_id on public.contacts
  for each row execute function public.tg_sync_contact_workspace_from_account();

create or replace function public.tg_sync_trigger_workspace_from_account()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  select a.workspace_id into strict new.workspace_id
  from public.accounts a
  where a.id = new.account_id;
  return new;
end;
$$;

drop trigger if exists tg_triggers_sync_workspace on public.triggers;
create trigger tg_triggers_sync_workspace
  before insert or update of account_id on public.triggers
  for each row execute function public.tg_sync_trigger_workspace_from_account();

create or replace function public.tg_accounts_cascade_workspace_to_children()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    update public.prospects set workspace_id = new.workspace_id where account_id = new.id;
    update public.contacts set workspace_id = new.workspace_id where account_id = new.id;
    update public.triggers set workspace_id = new.workspace_id where account_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists tg_accounts_cascade_workspace on public.accounts;
create trigger tg_accounts_cascade_workspace
  after update of workspace_id on public.accounts
  for each row execute function public.tg_accounts_cascade_workspace_to_children();

-- ---------------------------------------------------------------------------
-- 3) Restrictive policies (no accounts subselect from non-accounts tables)
-- ---------------------------------------------------------------------------
drop policy if exists contacts_workspace_restrictive on public.contacts;
create policy contacts_workspace_restrictive on public.contacts
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(contacts.workspace_id))
  with check (public.user_has_workspace_access(contacts.workspace_id));

drop policy if exists prospects_workspace_restrictive on public.prospects;
create policy prospects_workspace_restrictive on public.prospects
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(prospects.workspace_id))
  with check (public.user_has_workspace_access(prospects.workspace_id));

drop policy if exists triggers_workspace_restrictive on public.triggers;
create policy triggers_workspace_restrictive on public.triggers
  as restrictive for all to authenticated
  using (public.user_has_workspace_access(triggers.workspace_id))
  with check (public.user_has_workspace_access(triggers.workspace_id));

drop policy if exists dossiers_workspace_restrictive on public.dossiers;
create policy dossiers_workspace_restrictive on public.dossiers
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = dossiers.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = dossiers.prospect_id
    ))
  );

drop policy if exists dossier_versions_workspace_restrictive on public.dossier_versions;
create policy dossier_versions_workspace_restrictive on public.dossier_versions
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.dossiers d
      join public.prospects p on p.id = d.prospect_id
      where d.id = dossier_versions.dossier_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.dossiers d
      join public.prospects p on p.id = d.prospect_id
      where d.id = dossier_versions.dossier_id
    ))
  );

drop policy if exists activities_workspace_restrictive on public.activities;
create policy activities_workspace_restrictive on public.activities
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = activities.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = activities.prospect_id
    ))
  );

drop policy if exists tasks_workspace_restrictive on public.tasks;
create policy tasks_workspace_restrictive on public.tasks
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = tasks.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = tasks.prospect_id
    ))
  );

drop policy if exists enrichment_jobs_workspace_restrictive on public.enrichment_jobs;
create policy enrichment_jobs_workspace_restrictive on public.enrichment_jobs
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = enrichment_jobs.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = enrichment_jobs.prospect_id
    ))
  );

drop policy if exists deals_workspace_restrictive on public.deals;
create policy deals_workspace_restrictive on public.deals
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = deals.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = deals.prospect_id
    ))
  );

drop policy if exists proposals_workspace_restrictive on public.proposals;
create policy proposals_workspace_restrictive on public.proposals
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = proposals.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = proposals.prospect_id
    ))
  );

drop policy if exists proposal_versions_workspace_restrictive on public.proposal_versions;
create policy proposal_versions_workspace_restrictive on public.proposal_versions
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_versions.proposal_id
    ))
  );

drop policy if exists proposal_share_tokens_workspace_restrictive on public.proposal_share_tokens;
create policy proposal_share_tokens_workspace_restrictive on public.proposal_share_tokens
  as restrictive for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id
      from public.proposals pr
      join public.prospects p on p.id = pr.prospect_id
      where pr.id = proposal_share_tokens.proposal_id
    ))
  );

drop policy if exists prospect_sales_qa_rw on public.prospect_sales_qa;
create policy prospect_sales_qa_rw on public.prospect_sales_qa
  for all to authenticated
  using (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = prospect_sales_qa.prospect_id
    ))
  )
  with check (
    public.user_has_workspace_access((
      select p.workspace_id from public.prospects p where p.id = prospect_sales_qa.prospect_id
    ))
  );
