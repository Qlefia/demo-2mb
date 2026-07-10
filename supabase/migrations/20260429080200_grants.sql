-- Supabase newer defaults grant only REFERENCES/TRIGGER/TRUNCATE to anon+authenticated
-- on tables in `public`. RLS without DML grants = nothing visible. Grant select/insert/
-- update/delete to authenticated on every CRM table so RLS becomes the only gate.
-- service_role bypasses RLS, so any grant we add does not weaken safety.

grant usage on schema public to authenticated, service_role;

do $$
declare
  t text;
  tables text[] := array[
    'accounts',
    'contacts',
    'prospects',
    'triggers',
    'dossiers',
    'dossier_versions',
    'activities',
    'tasks',
    'playbooks',
    'enrichment_cache',
    'enrichment_jobs'
  ];
begin
  foreach t in array tables loop
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated;',
      t
    );
    execute format(
      'grant all on public.%I to service_role;',
      t
    );
  end loop;
end
$$;

-- Helper functions need to be callable by both roles.
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
