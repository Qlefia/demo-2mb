-- Unify image/link/note rows into a single `entry` artifact kind.
-- Postgres requires enum value commit before use — split in two migrations if applying manually.

alter type public.prospect_artifact_kind add value if not exists 'entry';
