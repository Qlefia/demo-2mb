-- Structured sales script fields: kind, one-line card summary, section blocks (JSON).

alter table public.playbooks
  add column if not exists kind text not null default 'first_touch';

alter table public.playbooks
  add column if not exists summary text not null default '';

alter table public.playbooks
  add column if not exists sections jsonb not null default '{}'::jsonb;

comment on column public.playbooks.kind is 'first_touch | follow_up | voicemail | objection | discovery_call';
comment on column public.playbooks.summary is 'One-line hook for list cards';
comment on column public.playbooks.sections is 'Structured script blocks; body is compiled read view for Sales';
