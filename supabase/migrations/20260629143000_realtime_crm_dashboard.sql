-- Enable Realtime for CRM tables used by dashboard + prospects list invalidation.
alter publication supabase_realtime add table public.prospects;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.dossiers;
