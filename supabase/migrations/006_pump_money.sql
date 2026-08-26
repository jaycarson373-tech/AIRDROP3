alter table public.epochs
  add column if not exists selection_seed text,
  add column if not exists selection_method text,
  add column if not exists selected_count integer not null default 0,
  add column if not exists reward_token_mint text;

alter table public.snapshots
  add column if not exists holding_multiplier_bps integer not null default 10000,
  add column if not exists selection_weight_bps integer not null default 10000,
  add column if not exists selected boolean not null default false;

alter table public.holder_states
  add column if not exists sell_events integer not null default 0,
  add column if not exists last_sell_at timestamptz;

alter table public.payouts drop constraint if exists payouts_status_check;
alter table public.payouts
  add constraint payouts_status_check
  check (status in ('planned', 'submitted', 'settled', 'failed', 'dry_run'));

create table if not exists public.worker_heartbeat (
  id text primary key,
  status text not null check (status in ('online', 'running', 'paused', 'degraded')),
  last_epoch_id text,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.worker_heartbeat enable row level security;

drop policy if exists "public read worker heartbeat" on public.worker_heartbeat;
create policy "public read worker heartbeat" on public.worker_heartbeat
  for select using (true);
