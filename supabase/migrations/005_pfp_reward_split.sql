alter table buys
  add column if not exists pfp_reward_lamports text not null default '0',
  add column if not exists pfp_reward_tx_sig text;
