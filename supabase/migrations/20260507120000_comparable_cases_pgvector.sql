-- Phase 6: comparable 2mb projects for dossier Section 8 (BACKLOG #10, ROADMAP Phase 6).
-- Table name `comparable_cases` avoids the bare identifier `cases` in SQL.

create extension if not exists vector;

create table public.comparable_cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  scale_units integer,
  project_type text,
  facade_style text,
  region text,
  year integer,
  summary text not null,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comparable_cases_slug_unique unique (slug)
);

create table public.case_embeddings (
  case_id uuid primary key references public.comparable_cases (id) on delete cascade,
  embedding vector(1536) not null,
  model text not null default 'text-embedding-3-large',
  updated_at timestamptz not null default now()
);

-- Small corpus (49 rows): IVFFLAT needs lists >= 1; HNSW works well for semantic search at this scale.
create index if not exists case_embeddings_hnsw_cosine
  on public.case_embeddings
  using hnsw (embedding vector_cosine_ops);

create trigger tg_comparable_cases_set_updated_at
  before update on public.comparable_cases
  for each row execute function public.tg_set_updated_at();

create trigger tg_case_embeddings_set_updated_at
  before update on public.case_embeddings
  for each row execute function public.tg_set_updated_at();

alter table public.comparable_cases enable row level security;
alter table public.case_embeddings enable row level security;

-- Mirror playbooks: catalogue readable by all CRM roles; writes ops/founder (seed uses service_role).

drop policy if exists "comparable_cases_founder_all" on public.comparable_cases;
create policy "comparable_cases_founder_all" on public.comparable_cases
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "comparable_cases_admin_select" on public.comparable_cases;
create policy "comparable_cases_admin_select" on public.comparable_cases
  for select to authenticated using (public.is_admin());

drop policy if exists "comparable_cases_ops_select" on public.comparable_cases;
create policy "comparable_cases_ops_select" on public.comparable_cases
  for select to authenticated using (public.is_ops());

drop policy if exists "comparable_cases_ops_insert" on public.comparable_cases;
create policy "comparable_cases_ops_insert" on public.comparable_cases
  for insert to authenticated with check (public.is_ops());

drop policy if exists "comparable_cases_ops_update" on public.comparable_cases;
create policy "comparable_cases_ops_update" on public.comparable_cases
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "comparable_cases_sales_select" on public.comparable_cases;
create policy "comparable_cases_sales_select" on public.comparable_cases
  for select to authenticated
  using (public.is_sales());

drop policy if exists "case_embeddings_founder_all" on public.case_embeddings;
create policy "case_embeddings_founder_all" on public.case_embeddings
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "case_embeddings_admin_select" on public.case_embeddings;
create policy "case_embeddings_admin_select" on public.case_embeddings
  for select to authenticated using (public.is_admin());

drop policy if exists "case_embeddings_ops_select" on public.case_embeddings;
create policy "case_embeddings_ops_select" on public.case_embeddings
  for select to authenticated using (public.is_ops());

drop policy if exists "case_embeddings_ops_insert" on public.case_embeddings;
create policy "case_embeddings_ops_insert" on public.case_embeddings
  for insert to authenticated with check (public.is_ops());

drop policy if exists "case_embeddings_ops_update" on public.case_embeddings;
create policy "case_embeddings_ops_update" on public.case_embeddings
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "case_embeddings_sales_select" on public.case_embeddings;
create policy "case_embeddings_sales_select" on public.case_embeddings
  for select to authenticated
  using (public.is_sales());

grant select, insert, update, delete on public.comparable_cases to authenticated;
grant all on public.comparable_cases to service_role;

grant select, insert, update, delete on public.case_embeddings to authenticated;
grant all on public.case_embeddings to service_role;
