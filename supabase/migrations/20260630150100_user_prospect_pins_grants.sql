-- Fix: user_prospect_pins was created without table-level GRANTs for authenticated.

grant select, insert, update, delete on public.user_prospect_pins to authenticated;
grant all on public.user_prospect_pins to service_role;
