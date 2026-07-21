begin;

truncate table public.payouts restart identity cascade;
truncate table public.snapshots restart identity cascade;
truncate table public.buys restart identity cascade;
truncate table public.claims restart identity cascade;
truncate table public.epochs restart identity cascade;
truncate table public.holder_states restart identity cascade;

truncate table public.scout_delivery_queue restart identity cascade;
truncate table public.scout_signal_events restart identity cascade;
truncate table public.scout_watchlists restart identity cascade;
truncate table public.scout_access_challenges restart identity cascade;
truncate table public.scout_access_sessions restart identity cascade;
truncate table public.scout_signals restart identity cascade;

commit;

select
  (select count(*) from public.epochs) as epochs,
  (select count(*) from public.claims) as claims,
  (select count(*) from public.buys) as buys,
  (select count(*) from public.payouts) as payouts,
  (select count(*) from public.holder_states) as holder_states,
  (select count(*) from public.scout_signals) as scout_signals;
