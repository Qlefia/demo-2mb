-- Distinguish commercial proposals from offers on the same proposals table.

do $$ begin
  create type public.document_kind as enum ('proposal', 'offer');
exception
  when duplicate_object then null;
end $$;

alter table public.proposals
  add column if not exists document_kind public.document_kind not null default 'proposal';

create index if not exists proposals_document_kind_idx on public.proposals (document_kind);
