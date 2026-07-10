# The Robin Hood

Source token: `$HOOD`
Reward asset: `HOODx`

One repo for:

- Vercel landing page and dashboard in `app/`
- Railway airdrop worker in `worker/`
- Supabase proof tables in `supabase/migrations/001_pump_airdrop.sql`

## Flow

Every epoch:

1. Claim creator fees to the treasury wallet.
2. Buy HOODx with 100% of usable claimed fees.
3. Snapshot `$HOOD` holders with at least `ELIGIBILITY_MIN`.
4. Exclude treasury, curve/pool addresses, `EXCLUDE_WALLETS`, holders above `MAX_HOLDER_PCT`, and wallets that permanently lost eligibility.
5. Select up to `MAX_WALLETS_PER_EPOCH` deterministic-random eligible holders for the epoch.
6. Score selected holders primarily by `$HOOD` held.
7. Airdrop HOODx directly to selected wallets.
8. Store epochs, snapshots, claims, HOODx buys, and payouts in Supabase for the dashboard.

## Holder Weighting

Reward weight starts from `$HOOD` held, then skews toward smaller holders:

- Eligible wallets above `MAX_HOLDER_PCT` are excluded before selection.
- Recipient selection is deterministic-random, with a boost for lower eligible balances.
- Payout weighting caps large holder balance impact around the median eligible wallet.
- Lower-balance wallets and lower-SOL-balance wallets receive additional weighting boosts.
- 100% of the reward pool buys HOODx.
- Eligible holders receive automatic HOODx payouts.
- Receipts are tracked in Supabase and linked to on-chain transactions.

Every epoch is 5 minutes. Default eligibility is 1,000,000 `$HOOD`. Selling any amount of `$HOOD`, or falling below `ELIGIBILITY_MIN`, permanently removes that wallet from future tracked distributions.

## Supabase

Run:

```sql
-- supabase/migrations/001_pump_airdrop.sql
```

If the first migration already exists in your project, also run the follow-up migrations:

```sql
-- supabase/migrations/002_golden_airdrop.sql
-- supabase/migrations/003_settled_payouts_only.sql
-- supabase/migrations/004_holder_states.sql
```

The migration enables public read policies for dashboard tables. The worker still uses the service-role key for writes.

To clear launch data right before going live:

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

## Vercel Env

Required:

```bash
NEXT_PUBLIC_PROJECT_NAME="The Robin Hood"
NEXT_PUBLIC_CA=3UiQ7mFuAdpeMUMbQTQDon8N1mK2L4YMiMzfpr4upump
NEXT_PUBLIC_SOURCE_SYMBOL=HOOD
NEXT_PUBLIC_REWARD_SYMBOL=HOODx
NEXT_PUBLIC_SOURCE_TOKEN_MINT=3UiQ7mFuAdpeMUMbQTQDon8N1mK2L4YMiMzfpr4upump
NEXT_PUBLIC_X_URL=<X_URL>
NEXT_PUBLIC_BUY_URL=https://pump.fun/coin/3UiQ7mFuAdpeMUMbQTQDon8N1mK2L4YMiMzfpr4upump
NEXT_PUBLIC_FIRST_AIRDROP_AT=<OPTIONAL_ISO_TIME>
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

Recommended server-only Vercel env for dashboard API reads:

```bash
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

Never prefix the service-role key with `NEXT_PUBLIC_`.

## Railway Env

Required:

```bash
REWARD_MODE=token
HELIUS_RPC_URL=<HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=3UiQ7mFuAdpeMUMbQTQDon8N1mK2L4YMiMzfpr4upump
REWARD_TOKEN_MINT=<HOODX_MINT>
TREASURY_WALLET_SECRET=<BASE58_OR_JSON_SECRET_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

Launch gates:

```bash
CLAIM_ENABLED=false
BUY_ENABLED=false
AIRDROP_ENABLED=false
```

Turn `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED` to `true` only when the live wallet is funded and ready.

Reward settings:

```bash
EPOCH_MINUTES=5
ELIGIBILITY_MIN=1000000
MAX_WALLETS_PER_EPOCH=150
MAX_HOLDER_PCT=5
EXCLUDE_WALLETS=
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE` and `AIRDROP_SOL_RESERVE` keep SOL available for transaction fees before the worker buys and distributes HOODx. `AIRDROP_REWARD_BPS=10000` routes the full configured reward pool to eligible holders.

`REWARD_TOKEN_MINT`, `SWAP_BALANCE_BPS`, and `SWAP_SLIPPAGE_BPS` are required for token reward mode.

## Commands

```bash
npm install
npm run dev
npm run build
npm run worker:build
npm run worker:dev
```

Railway should use:

```bash
npm run worker:start
```

The included `railway.json` builds and starts the worker service.

## Safety Notes

- All live money movement defaults off.
- A failed claim logs and continues; it does not crash-loop the worker.
- Epochs are idempotent by `epoch_id`.
- Payouts are idempotent by `epoch_id:wallet`.
- In `REWARD_MODE=token`, the worker buys the configured reward token and creates holder token accounts when needed.
- Dashboard reads Supabase; it does not need wallet secrets.
