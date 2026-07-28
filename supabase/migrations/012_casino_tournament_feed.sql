-- Keep the next wallet visible for the live broadcast without exposing its
-- score, outcome, tie-break, or result hash before the scheduled reveal.
drop view if exists public.casino_public_current_play;

create view public.casino_public_current_play as
select
  result.round_id,
  result.wallet,
  result.sequence_index,
  result.game,
  result.scheduled_at
from public.casino_game_results result
where result.sequence_index = (
  select min(candidate.sequence_index)
  from public.casino_game_results candidate
  where candidate.round_id = result.round_id
    and candidate.scheduled_at > now()
);

revoke all on public.casino_public_current_play from public;
grant select on public.casino_public_current_play to anon, authenticated, service_role;
