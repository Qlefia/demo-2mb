-- Per-prospect pitch selection: which studio catalogue services / works to
-- pitch this client. Ids reference workspace_studio_settings.sales jsonb
-- (serviceCatalog[].id, works[].id). Stored as jsonb arrays on the prospect.
alter table public.prospects
  add column if not exists pitch_service_ids jsonb not null default '[]'::jsonb,
  add column if not exists pitch_work_ids jsonb not null default '[]'::jsonb;
