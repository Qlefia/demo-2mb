-- Generic updated_at trigger applied to every table that carries updated_at.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tbl text;
  -- Only tables that actually carry an `updated_at` column. `tasks` was
  -- listed here historically but never gained the column; we removed it in
  -- 20260429125500_drop_tasks_updated_at_trigger.sql.
  tables text[] := array[
    'accounts',
    'contacts',
    'prospects',
    'dossiers',
    'playbooks'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'drop trigger if exists tg_%I_set_updated_at on public.%I;',
      tbl,
      tbl
    );
    execute format(
      'create trigger tg_%I_set_updated_at before update on public.%I '
      || 'for each row execute function public.tg_set_updated_at();',
      tbl,
      tbl
    );
  end loop;
end
$$;
