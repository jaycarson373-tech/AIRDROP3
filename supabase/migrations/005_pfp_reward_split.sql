do $$
begin
  if to_regclass('public.buys') is not null then
    alter table public.buys
      add column if not exists pfp_reward_lamports text not null default '0',
      add column if not exists pfp_reward_tx_sig text;
  else
    raise notice 'public.buys does not exist yet; run 001_pump_airdrop.sql first';
  end if;
end $$;
