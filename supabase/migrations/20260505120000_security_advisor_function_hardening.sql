-- Supabase Security Advisor: Function Search Path Mutable; SECURITY DEFINER RPC on triggers.
-- 1) SET search_path = public, pg_temp on all public helper and trigger functions.
-- 2) Revoke direct EXECUTE on tg_audit_prospects from client roles (trigger still fires).

create or replace function public.stage_rank(s public.prospect_stage)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select case s
    when 'new' then 1
    when 'triaged' then 2
    when 'enriching' then 3
    when 'dossier_in_progress' then 4
    when 'dossier_ready' then 5
    when '1st_call' then 6
    when 'meeting_scheduled' then 7
    when 'proposal_sent' then 8
    when 'won' then 9
    when 'lost' then 10
  end
$$;

create or replace function public.current_role()
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    'unassigned'
  )
$$;

create or replace function public.current_territory()
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'territory', '')
$$;

create or replace function public.is_founder() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() = 'founder' $$;

create or replace function public.is_admin() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() = 'admin' $$;

create or replace function public.is_ops() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() = 'ops' $$;

create or replace function public.is_sales_de() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() = 'sales_de' $$;

create or replace function public.is_sales_uk() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() = 'sales_uk' $$;

create or replace function public.is_sales() returns boolean
language sql
stable
set search_path = public, pg_temp
as $$ select public.current_role() in ('sales_de', 'sales_uk') $$;

create or replace function public.sales_territory()
returns public.territory
language sql
stable
set search_path = public, pg_temp
as $$
  select case public.current_role()
    when 'sales_de' then 'DE'::public.territory
    when 'sales_uk' then 'UK'::public.territory
    else null::public.territory
  end
$$;

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.tg_audit_prospects()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changes jsonb := '{}'::jsonb;
  activity_kind public.activity_type;
begin
  if new.stage is distinct from old.stage then
    changes := changes || jsonb_build_object(
      'stage',
      jsonb_build_object('from', old.stage, 'to', new.stage)
    );
  end if;
  if new.owner_id is distinct from old.owner_id then
    changes := changes || jsonb_build_object(
      'owner_id',
      jsonb_build_object('from', old.owner_id, 'to', new.owner_id)
    );
  end if;
  if new.priority is distinct from old.priority then
    changes := changes || jsonb_build_object(
      'priority',
      jsonb_build_object('from', old.priority, 'to', new.priority)
    );
  end if;
  if new.lost_reason is distinct from old.lost_reason then
    changes := changes || jsonb_build_object(
      'lost_reason',
      jsonb_build_object('from', old.lost_reason, 'to', new.lost_reason)
    );
  end if;

  if changes = '{}'::jsonb then
    return new;
  end if;

  if changes ? 'stage' and not (changes ? 'owner_id' or changes ? 'priority' or changes ? 'lost_reason') then
    activity_kind := 'stage_change';
  elsif changes ? 'owner_id' and not (changes ? 'stage' or changes ? 'priority' or changes ? 'lost_reason') then
    activity_kind := 'owner_change';
  else
    activity_kind := 'audit';
  end if;

  insert into public.activities (prospect_id, actor_id, type, payload)
  values (new.id, auth.uid(), activity_kind, changes);

  return new;
end;
$$;

revoke all on function public.tg_audit_prospects() from public;
revoke all on function public.tg_audit_prospects() from anon;
revoke all on function public.tg_audit_prospects() from authenticated;

grant execute on function
  public.current_role(),
  public.current_territory(),
  public.is_founder(),
  public.is_admin(),
  public.is_ops(),
  public.is_sales_de(),
  public.is_sales_uk(),
  public.is_sales(),
  public.sales_territory(),
  public.stage_rank(public.prospect_stage)
  to authenticated, service_role;
