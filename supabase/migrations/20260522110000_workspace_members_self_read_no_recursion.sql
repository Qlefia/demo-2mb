-- Replace the recursive self_read policy on workspace_members.
--
-- Previous version:
--   USING (EXISTS (SELECT 1 FROM workspace_members m
--                  WHERE m.workspace_id = workspace_members.workspace_id
--                    AND m.user_id = auth.uid()))
-- This subquery on the same table triggered Postgres 42P17 'infinite recursion
-- detected in policy for relation workspace_members' on every PostgREST read
-- by an authenticated user. The Drizzle pool was the only thing reading
-- membership before because it ran under the privileged role and bypassed RLS.
--
-- New policy lets each user read only their OWN membership rows — which is all
-- the app needs (resolving the user's primary workspace, RLS gates everywhere
-- else). Cross-tenant member listings (e.g. Team UI) still flow through the
-- service-role admin endpoints (`getServiceClient()`), not PostgREST under the
-- user JWT, so this tightening is consistent with how Team already loads.

DROP POLICY IF EXISTS workspace_members_self_read ON public.workspace_members;

CREATE POLICY workspace_members_self_read
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
