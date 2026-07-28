-- Run after migrations 001 through 013. This script is read-only.
with expected_objects(object_name) as (
  values
    ('public.epochs'),
    ('public.snapshots'),
    ('public.payouts'),
    ('public.casino_rounds'),
    ('public.casino_winners'),
    ('public.casino_game_results'),
    ('public.casino_chat_messages'),
    ('public.casino_public_rounds'),
    ('public.casino_public_current_play')
)
select
  object_name,
  case when to_regclass(object_name) is null then 'MISSING' else 'READY' end as status
from expected_objects
order by object_name;

select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'casino_rounds',
    'casino_winners',
    'casino_game_results',
    'casino_chat_messages'
  )
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'casino_rounds',
    'casino_winners',
    'casino_game_results',
    'casino_chat_messages'
  )
order by tablename, policyname;

select
  column_name,
  case when column_name in (
    'randomness_program',
    'randomness_queue',
    'randomness_authority',
    'randomness_account',
    'randomness_commit_slot',
    'randomness_reveal_slot',
    'randomness_binding',
    'randomness_hex',
    'randomness_commit_tx_sig',
    'randomness_reveal_tx_sig',
    'randomness_verified_at'
  ) then 'READY' else 'IGNORED' end as proof_column_status
from information_schema.columns
where table_schema = 'public'
  and table_name = 'casino_rounds'
  and column_name like 'randomness_%'
order by column_name;
