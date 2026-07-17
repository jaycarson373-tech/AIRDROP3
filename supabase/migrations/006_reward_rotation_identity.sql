do $$
begin
  if to_regclass('public.buys') is not null then
    alter table public.buys
      add column if not exists reward_mint text,
      add column if not exists reward_asset text;
  else
    raise notice 'public.buys does not exist yet; run 001_pump_airdrop.sql first';
  end if;

  if to_regclass('public.payouts') is not null then
    alter table public.payouts
      add column if not exists reward_mint text,
      add column if not exists reward_asset text;
  else
    raise notice 'public.payouts does not exist yet; run 001_pump_airdrop.sql first';
  end if;
end $$;

create index if not exists buys_reward_mint_idx on public.buys(reward_mint);
create index if not exists payouts_reward_mint_status_idx on public.payouts(reward_mint, status);
