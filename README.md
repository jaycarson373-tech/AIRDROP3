# HOOD Strategy

Source token: `$HOODSTR`
Reward asset: `HOODx`

One repo for:

- Vercel landing page and dashboard in `app/`
- Railway airdrop worker in `worker/`
- Supabase proof tables in `supabase/migrations/001_pump_airdrop.sql`

## Flow

Every epoch:

1. Claim creator fees to the treasury wallet.
2. Swap the available creator-fee SOL into the reward token in token mode.
3. Snapshot `$HOODSTR` holders with at least `ELIGIBILITY_MIN`.
4. Exclude treasury, curve/pool addresses, `EXCLUDE_WALLETS`, holders above `MAX_HOLDER_PCT`, and wallets that permanently lost eligibility.
5. Select up to `MAX_WALLETS_PER_EPOCH` deterministic-random eligible holders for the epoch.
6. Score selected holders primarily by `$HOODSTR` held, with capped boosts for smaller holders and lower-SOL-balance wallets.
7. Airdrop HOODx reward tokens directly to selected wallets.
8. Pick one selected recipient as the separate 5x Strategy Bonus winner when balance allows.
9. Store epochs, snapshots, claims, bonus fields, reward pools, and payouts in Supabase for the dashboard.

## HOOD Strategy Weighting

Reward weight stays simple and starts from `$HOODSTR` held:

- `$HOODSTR` balance is the foundation of the score.
- 100K-500K HOODSTR receives a 1.35x holder boost.
- 500K-1M HOODSTR receives a 1.20x holder boost.
- 1M-3M HOODSTR receives a 1.10x holder boost.
- 3M+ HOODSTR receives a 1.00x holder boost.
- Wallets with less than 1 SOL receive a 1.35x SOL boost.
- Wallets with 1-5 SOL receive a 1.20x SOL boost.
- Wallets with 5-20 SOL receive a 1.10x SOL boost.
- Wallets with 20+ SOL receive a 1.00x SOL boost.
- The boost is capped, so supply held still dominates.
- One selected recipient can receive the separate 5x Strategy Bonus.

Every epoch is 5 minutes. Default eligibility is 100,000 `$HOODSTR`. Selling any amount of `$HOODSTR`, or falling below `ELIGIBILITY_MIN`, permanently removes that wallet from future tracked distributions.

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
NEXT_PUBLIC_PROJECT_NAME="HOOD Strategy"
NEXT_PUBLIC_CA=HzrETRY4Dr2wFZLedzXbshdD4yLiwB7HhKE48F4Kpump
NEXT_PUBLIC_SOURCE_SYMBOL=HOODSTR
NEXT_PUBLIC_REWARD_SYMBOL=HOODx
NEXT_PUBLIC_SOURCE_TOKEN_MINT=HzrETRY4Dr2wFZLedzXbshdD4yLiwB7HhKE48F4Kpump
NEXT_PUBLIC_REWARD_TOKEN_MINT=XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg
NEXT_PUBLIC_ELIGIBILITY_LABEL=100K
NEXT_PUBLIC_X_URL=https://x.com/HOODSTR_
NEXT_PUBLIC_BUY_URL=https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=HzrETRY4Dr2wFZLedzXbshdD4yLiwB7HhKE48F4Kpump
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
SOURCE_TOKEN_MINT=HzrETRY4Dr2wFZLedzXbshdD4yLiwB7HhKE48F4Kpump
REWARD_TOKEN_MINT=XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg
TREASURY_WALLET_SECRET=<BASE58_OR_JSON_SECRET_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

Launch gates:

```bash
CLAIM_ENABLED=true
BUY_ENABLED=true
AIRDROP_ENABLED=true
```

Keep `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED` true for the live HOODSTR -> HOODx flow. Turn `AIRDROP_ENABLED=false` only when you want claims and swaps to run without sending rewards.

Reward settings:

```bash
EPOCH_MINUTES=5
ELIGIBILITY_MIN=100000
MAX_WALLETS_PER_EPOCH=150
MAX_HOLDER_PCT=5
EXCLUDE_WALLETS=
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
SWAP_BALANCE_BPS=9000
SWAP_SLIPPAGE_BPS=1000
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=9000
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE=0.3` keeps at least 0.30 SOL untouched before the swap pool is calculated. `AIRDROP_SOL_RESERVE=0.05` is the post-airdrop transaction buffer. `SWAP_BALANCE_BPS=9000` uses 90% of available SOL after reserve for the HOODx buy. `AIRDROP_REWARD_BPS=9000` distributes 90% of the available HOODx reward balance each epoch after reserve logic.

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
- In `REWARD_MODE=token`, the worker calls Jupiter for the reward-token swap and creates holder token accounts idempotently when needed.
- Dashboard reads Supabase; it does not need wallet secrets.
