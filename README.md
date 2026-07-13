# Copy Cat

Source token: `$COPYCAT`
Active copied asset: `$PCAT`

Copy Cat tracks smart-wallet signals, buys the configured copied asset with creator fees, and airdrops it to eligible `$COPYCAT` holders.

## Current Launch Values

```bash
NEXT_PUBLIC_PROJECT_NAME="Copy Cat"
NEXT_PUBLIC_SOURCE_SYMBOL="Copycat"
NEXT_PUBLIC_SOURCE_TOKEN_MINT="2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump"
NEXT_PUBLIC_REWARD_SYMBOL="PCAT"
NEXT_PUBLIC_REWARD_TOKEN_MINT="3dejiWxvpL6QH63rBE38fSrVbna8pVrKbmbPPDke7wuH"
NEXT_PUBLIC_CA="2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump"
NEXT_PUBLIC_X_URL="https://x.com/CopyCat_pf"
NEXT_PUBLIC_EPOCH_MINUTES="5"
NEXT_PUBLIC_ELIGIBILITY_MIN="1000000"
```

## Flow

Every scheduled epoch:

1. Claim creator fees to the treasury wallet.
2. Buy the configured copied asset with the configured reward budget.
3. Snapshot `$COPYCAT` holders with at least `ELIGIBILITY_MIN`.
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
SOURCE_TOKEN_MINT="2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump"
REWARD_TOKEN_MINT="3dejiWxvpL6QH63rBE38fSrVbna8pVrKbmbPPDke7wuH"
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
