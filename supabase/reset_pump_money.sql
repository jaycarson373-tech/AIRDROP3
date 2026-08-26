begin;

truncate table public.payouts restart identity cascade;
truncate table public.snapshots restart identity cascade;
truncate table public.buys restart identity cascade;
truncate table public.claims restart identity cascade;
truncate table public.epochs restart identity cascade;
truncate table public.holder_states restart identity cascade;
truncate table public.worker_heartbeat restart identity cascade;

commit;
