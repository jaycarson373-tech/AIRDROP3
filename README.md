# SMI6900

Source token: `$SMI6900`
Reward rail: rotating meme-index assets

SMI6900 is a holder reward meme index. One coin can be the current active drop while new and older meme assets are continuously added to the index basket. Fees can buy configured index assets, then airdrop the resulting rewards to eligible `$SMI6900` holders with epoch-based hold weighting.

## Current Launch Values

```bash
NEXT_PUBLIC_PROJECT_NAME="SMI6900"
NEXT_PUBLIC_SOURCE_SYMBOL="SMI6900"
NEXT_PUBLIC_SOURCE_TOKEN_MINT="<SMI6900_SOURCE_TOKEN_MINT>"
NEXT_PUBLIC_REWARD_SYMBOL="<CURRENT_INDEX_DROP_SYMBOL>"
NEXT_PUBLIC_REWARD_TOKEN_MINT="<CURRENT_INDEX_DROP_MINT>"
NEXT_PUBLIC_CA="<SMI6900_SOURCE_TOKEN_MINT>"
NEXT_PUBLIC_X_URL="https://x.com/SMI6900"
NEXT_PUBLIC_DEXSCREENER_URL="https://dexscreener.com/solana/<SMI6900_SOURCE_TOKEN_MINT>"
NEXT_PUBLIC_EPOCH_MINUTES="5"
NEXT_PUBLIC_ELIGIBILITY_MIN="1000000"
```

## Flow

Every scheduled epoch:

1. Claim creator fees to the treasury wallet.
2. Buy the configured current index asset with the configured reward budget.
3. Snapshot `$SMI6900` holders with at least `ELIGIBILITY_MIN`.
4. Exclude treasury, pool addresses, explicit exclusions, and wallets above `MAX_HOLDER_PCT`.
5. Apply hold multipliers and smaller-wallet weighting.
6. Airdrop the configured reward token directly to selected wallets.
7. Store epochs, snapshots, buys, payouts, and receipts in Supabase for the site.

## Launch Reset Query

Run this in Supabase when you need to clear the old launch data:

```sql
begin;

do $$
declare
  t text;
begin
  foreach t in array array['payouts','snapshots','buys','claims','epochs','holder_states']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('truncate table public.%I restart identity cascade', t);
    end if;
  end loop;
end $$;

commit;
```

## Railway Essentials

```bash
REWARD_MODE="token"
CLAIM_ENABLED="true"
BUY_ENABLED="true"
AIRDROP_ENABLED="true"
SOURCE_TOKEN_MINT="<SMI6900_SOURCE_TOKEN_MINT>"
REWARD_TOKEN_MINT="<CURRENT_INDEX_DROP_MINT>"
EPOCH_MINUTES="5"
ELIGIBILITY_MIN="1000000"
MAX_HOLDER_PCT="4"
REWARD_BUY_BPS="10000"
AIRDROP_REWARD_BPS="10000"
SWAP_BALANCE_BPS="10000"
MIN_SOL_RESERVE="0.3"
AIRDROP_SOL_RESERVE="0.05"
```

Never expose `SUPABASE_SERVICE_ROLE` or `TREASURY_WALLET_SECRET` through `NEXT_PUBLIC_`.
