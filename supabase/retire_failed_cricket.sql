-- Retire the failed Cricket call immediately without deleting the audit record.
-- Paste this file into the Supabase SQL Editor and click Run.

begin;

with retired as (
  update public.scout_signals
  set status = 'rejected',
      retired_at = now(),
      updated_at = now()
  where mint = 'J33WbCWN2m1EpoNUP9Ch6cWoV5j6BFJervDfgPk3pump'
    and status = 'active'
  returning id
)
insert into public.scout_signal_events (signal_id, event_type, payload)
select
  id,
  'target_removed',
  jsonb_build_object('reason', 'Runner failed after scan', 'source', 'manual')
from retired;

commit;
