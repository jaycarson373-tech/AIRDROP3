-- GOAT dual-asset distributions: preserve one independently verifiable buy
-- and payout identity for each reward mint inside the same five-minute epoch.

update public.scout_settings
set value = 'Minimum GOAT balance for holder distributions.'
where key = 'eligibility_minimum';

update public.payouts
set reward_mint = coalesce(nullif(reward_mint, ''), 'legacy'),
    reward_asset = coalesce(nullif(reward_asset, ''), 'TOKEN')
where reward_mint is null
   or reward_mint = ''
   or reward_asset is null
   or reward_asset = '';

alter table public.payouts
  alter column reward_mint set not null,
  alter column reward_asset set not null;

alter table public.payouts drop constraint if exists payouts_pkey;
alter table public.payouts
  add constraint payouts_pkey primary key (epoch_id, wallet, reward_mint);

create table if not exists public.reward_buys (
  epoch_id text not null references public.epochs(epoch_id) on delete cascade,
  reward_mint text not null,
  reward_asset text not null,
  split_bps integer not null check (split_bps >= 0 and split_bps <= 10000),
  base_spent_lamports text not null,
  reward_received_raw text not null,
  reward_received numeric not null default 0,
  tx_sig text,
  status text not null check (status in ('settled', 'dry_run')),
  created_at timestamptz not null default now(),
  primary key (epoch_id, reward_mint)
);

create index if not exists reward_buys_epoch_idx on public.reward_buys(epoch_id);
create index if not exists reward_buys_asset_idx on public.reward_buys(reward_asset, created_at desc);

alter table public.reward_buys enable row level security;
drop policy if exists "public read reward buys" on public.reward_buys;
create policy "public read reward buys" on public.reward_buys
  for select using (status = 'settled');
