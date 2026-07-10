-- Multiple screenshots per artifact entry (up to 20 paths in app layer).

alter table public.prospect_artifacts
  add column if not exists image_paths text[] not null default '{}';

update public.prospect_artifacts
set image_paths = array[storage_path]
where storage_path is not null
  and cardinality(image_paths) = 0;
