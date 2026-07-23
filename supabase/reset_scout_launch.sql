begin;

truncate table public.payouts restart identity cascade;
truncate table public.snapshots restart identity cascade;
truncate table public.buys restart identity cascade;
truncate table public.claims restart identity cascade;
truncate table public.epochs restart identity cascade;
truncate table public.holder_states restart identity cascade;

do $reset_optional_tables$
declare
  table_name text;
begin
  foreach table_name in array array[
    'public.scout_delivery_queue',
    'public.scout_signal_events',
    'public.scout_watchlists',
    'public.scout_access_challenges',
    'public.scout_access_sessions',
    'public.scout_signals'
  ]
  loop
    if to_regclass(table_name) is not null then
      execute format('truncate table %s restart identity cascade', table_name);
    end if;
  end loop;
end
$reset_optional_tables$;

commit;

select
  (select count(*) from public.epochs) as epochs,
  (select count(*) from public.claims) as claims,
  (select count(*) from public.buys) as buys,
  (select count(*) from public.payouts) as payouts,
  (select count(*) from public.holder_states) as holder_states;
