-- RLS helpers. Keep them in `public` so policies can reference them
-- without fully qualifying. All are STABLE / IMMUTABLE so the planner
-- can inline them inside policies.

-- Numeric rank of a prospect stage; used to express "stage >= dossier_ready".
create or replace function public.stage_rank(s public.prospect_stage)
returns integer
language sql
immutable
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

-- Reads the JWT role claim. Defaults to 'admin' (read-only) when missing.
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    'admin'
  )
$$;

create or replace function public.current_territory()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'territory', '')
$$;

create or replace function public.is_founder() returns boolean
language sql stable as $$ select public.current_role() = 'founder' $$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.current_role() = 'admin' $$;

create or replace function public.is_ops() returns boolean
language sql stable as $$ select public.current_role() = 'ops' $$;

create or replace function public.is_sales_de() returns boolean
language sql stable as $$ select public.current_role() = 'sales_de' $$;

create or replace function public.is_sales_uk() returns boolean
language sql stable as $$ select public.current_role() = 'sales_uk' $$;

create or replace function public.is_sales() returns boolean
language sql stable as $$ select public.current_role() in ('sales_de', 'sales_uk') $$;

-- Territory a sales seat owns ('DE' for sales_de, 'UK' for sales_uk).
create or replace function public.sales_territory()
returns public.territory
language sql
stable
as $$
  select case public.current_role()
    when 'sales_de' then 'DE'::public.territory
    when 'sales_uk' then 'UK'::public.territory
    else null::public.territory
  end
$$;
