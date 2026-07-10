-- Developer deck parity: mailing address on accounts, organization sender profile,
-- proposal issued/valid/project meta, service_tags library.

alter table public.accounts
  add column if not exists mailing_street text,
  add column if not exists mailing_postal_code text,
  add column if not exists mailing_locality text,
  add column if not exists mailing_country_code text;

alter table public.proposals
  add column if not exists issued_at timestamp with time zone,
  add column if not exists validity_days smallint not null default 3,
  add column if not exists project_name text;

create table if not exists public.organization_profile (
  singleton smallint primary key check (singleton = 1),
  legal_name text not null,
  address_line text not null,
  register_line text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

insert into public.organization_profile (singleton, legal_name, address_line, register_line)
values (
  1,
  'BEDEROV GmbH',
  'Kurfürstendamm 11, 10719 Berlin, Germany',
  'Commercial Register: HRB 92666'
)
on conflict (singleton) do nothing;

create table if not exists public.service_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_de text not null,
  label_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists service_tags_sort_idx on public.service_tags (is_active, sort_order);

insert into public.service_tags (slug, label_de, label_en, sort_order, is_active) values
  ('cgi-exterior', 'CGI Außenvisualisierung', 'CGI exterior visualization', 10, true),
  ('cgi-interior', 'CGI Innenvisualisierung', 'CGI interior visualization', 20, true),
  ('animation-film', 'Architektur-Film / Animation', 'Architecture film / animation', 30, true),
  ('vr-walkthrough', 'VR Walkthrough', 'VR walkthrough', 40, true),
  ('still-images', 'Still Renderings', 'Still renderings', 50, true),
  ('plan-to-image', 'Plan zu Bild', 'Plan to image', 60, true),
  ('facade-study', 'Fassadenstudien', 'Facade studies', 70, true),
  ('lighting-study', 'Lichtstudien', 'Lighting studies', 80, true),
  ('masterplan-viz', 'Masterplan-Visualisierung', 'Masterplan visualization', 90, true),
  ('concept-design', 'Konzeptvisualisierung', 'Concept visualization', 100, true),
  ('marketing-suite', 'Marketing-Paket', 'Marketing suite', 110, true),
  ('delivery-web', 'Web-optimierte Auslieferung', 'Web-optimized delivery', 120, true)
on conflict (slug) do nothing;

alter table public.organization_profile enable row level security;
alter table public.service_tags enable row level security;

drop policy if exists "organization_profile_founder_all" on public.organization_profile;
create policy "organization_profile_founder_all" on public.organization_profile
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "organization_profile_admin_select" on public.organization_profile;
create policy "organization_profile_admin_select" on public.organization_profile
  for select to authenticated using (public.is_admin());

drop policy if exists "organization_profile_ops_select" on public.organization_profile;
create policy "organization_profile_ops_select" on public.organization_profile
  for select to authenticated using (public.is_ops());

drop policy if exists "organization_profile_ops_update" on public.organization_profile;
create policy "organization_profile_ops_update" on public.organization_profile
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "organization_profile_sales_select" on public.organization_profile;
create policy "organization_profile_sales_select" on public.organization_profile
  for select to authenticated using (public.is_sales());

drop policy if exists "service_tags_founder_all" on public.service_tags;
create policy "service_tags_founder_all" on public.service_tags
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

drop policy if exists "service_tags_admin_select" on public.service_tags;
create policy "service_tags_admin_select" on public.service_tags
  for select to authenticated using (public.is_admin());

drop policy if exists "service_tags_ops_select" on public.service_tags;
create policy "service_tags_ops_select" on public.service_tags
  for select to authenticated using (public.is_ops());

drop policy if exists "service_tags_ops_insert" on public.service_tags;
create policy "service_tags_ops_insert" on public.service_tags
  for insert to authenticated with check (public.is_ops());

drop policy if exists "service_tags_ops_update" on public.service_tags;
create policy "service_tags_ops_update" on public.service_tags
  for update to authenticated
  using (public.is_ops()) with check (public.is_ops());

drop policy if exists "service_tags_ops_delete" on public.service_tags;
create policy "service_tags_ops_delete" on public.service_tags
  for delete to authenticated using (public.is_ops());

drop policy if exists "service_tags_sales_select" on public.service_tags;
create policy "service_tags_sales_select" on public.service_tags
  for select to authenticated using (public.is_sales());

grant select, insert, update, delete on public.organization_profile to authenticated;
grant all on public.organization_profile to service_role;

grant select, insert, update, delete on public.service_tags to authenticated;
grant all on public.service_tags to service_role;
