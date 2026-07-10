-- Audit trail for prospects. Writes to activities whenever any of
-- (stage, owner_id, priority, lost_reason) changes. Cannot be bypassed
-- by service-role calls — service role bypasses RLS, not triggers.
create or replace function public.tg_audit_prospects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  activity_kind public.activity_type;
begin
  if new.stage is distinct from old.stage then
    changes := changes || jsonb_build_object(
      'stage',
      jsonb_build_object('from', old.stage, 'to', new.stage)
    );
  end if;
  if new.owner_id is distinct from old.owner_id then
    changes := changes || jsonb_build_object(
      'owner_id',
      jsonb_build_object('from', old.owner_id, 'to', new.owner_id)
    );
  end if;
  if new.priority is distinct from old.priority then
    changes := changes || jsonb_build_object(
      'priority',
      jsonb_build_object('from', old.priority, 'to', new.priority)
    );
  end if;
  if new.lost_reason is distinct from old.lost_reason then
    changes := changes || jsonb_build_object(
      'lost_reason',
      jsonb_build_object('from', old.lost_reason, 'to', new.lost_reason)
    );
  end if;

  if changes = '{}'::jsonb then
    return new;
  end if;

  if changes ? 'stage' and not (changes ? 'owner_id' or changes ? 'priority' or changes ? 'lost_reason') then
    activity_kind := 'stage_change';
  elsif changes ? 'owner_id' and not (changes ? 'stage' or changes ? 'priority' or changes ? 'lost_reason') then
    activity_kind := 'owner_change';
  else
    activity_kind := 'audit';
  end if;

  insert into public.activities (prospect_id, actor_id, type, payload)
  values (new.id, auth.uid(), activity_kind, changes);

  return new;
end;
$$;

drop trigger if exists tg_prospects_audit on public.prospects;
create trigger tg_prospects_audit
after update on public.prospects
for each row
execute function public.tg_audit_prospects();
