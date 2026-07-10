-- Extensions required by the schema. Run BEFORE 20260429074652_init_schema.sql.
-- pgcrypto and uuid-ossp are already enabled on this Supabase project.
create extension if not exists "citext" with schema "extensions";
