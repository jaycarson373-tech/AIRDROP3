-- Run after migrations 001 through 012. This script is read-only.
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
