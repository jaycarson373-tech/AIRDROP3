# Robin Hood

Source token: `$HOOD`
Reward token: configured by `REWARD_TOKEN_MINT`

One repo for:

- Vercel landing page and dashboard in `app/`
- Railway airdrop worker in `worker/`
- Supabase proof tables in `supabase/migrations/001_pump_airdrop.sql`

## Flow

Every epoch:

1. Claim creator fees to the treasury wallet.
2. Swap available SOL to the reward token through Jupiter.
3. Snapshot `$HOOD` holders with at least `ELIGIBILITY_MIN`.
4. Exclude treasury, curve/pool addresses, `EXCLUDE_WALLETS`, and holders above `MAX_HOLDER_PCT`.
5. Select `MAX_WALLETS_PER_EPOCH` deterministic-random eligible holders for the epoch and airdrop the reward-token balance across those recipients.
6. Pick one selected recipient as the 5x Hood Bonus winner when balance allows.
7. Store epochs, buys, snapshots, claims, bonus fields, and payouts in Supabase for the dashboard.

## Robin Hood Weighting

Reward weight is intentionally simple and starts from `$HOOD` held:

- `$HOOD` balance is the foundation of the score.
- Continuous eligibility / hold time adds a capped score boost.
- Wallets that sell or drop below `ELIGIBILITY_MIN` are removed from future tracked distributions.
- On-chain wallet value adds a capped score signal.
- One selected recipient can receive the separate 5x Hood Bonus.

Every epoch is 5 minutes. Selling any amount of `$HOOD`, or falling below `ELIGIBILITY_MIN`, permanently removes that wallet from future tracked distributions.

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

## Vercel Env

Required:

```bash
NEXT_PUBLIC_PROJECT_NAME="Robin Hood"
NEXT_PUBLIC_CA=<HOOD_MINT>
NEXT_PUBLIC_SOURCE_SYMBOL=HOOD
NEXT_PUBLIC_REWARD_SYMBOL=<REWARD_SYMBOL>
NEXT_PUBLIC_SOURCE_TOKEN_MINT=<HOOD_MINT>
NEXT_PUBLIC_REWARD_TOKEN_MINT=<REWARD_MINT>
NEXT_PUBLIC_X_URL=https://x.com
NEXT_PUBLIC_BUY_URL=<BUY_LINK>
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
HELIUS_RPC_URL=<HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=<HOOD_MINT>
REWARD_TOKEN_MINT=<REWARD_MINT>
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

Turn those to `true` only when live.

Reward settings:

```bash
EPOCH_MINUTES=5
ELIGIBILITY_MIN=1000000
MAX_WALLETS_PER_EPOCH=75
MAX_HOLDER_PCT=5
EXCLUDE_WALLETS=
SWAP_BALANCE_BPS=9000
MIN_SOL_RESERVE=0.2
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=4000
SWAP_SLIPPAGE_BPS=300
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`SWAP_BALANCE_BPS=9000` spends up to 90% of SOL while also respecting `MIN_SOL_RESERVE`, so the treasury keeps at least 0.2 SOL after the buy. The worker enforces a minimum `MIN_SOL_RESERVE` of 0.2 and a minimum `AIRDROP_SOL_RESERVE` of 0.05 even if lower env values are configured.
During payout, SOL above the 0.05 airdrop reserve can be used to create missing reward-token associated token accounts. The worker does not send SOL directly to holder wallets.
`AIRDROP_REWARD_BPS=4000` distributes 40% of available reward tokens each epoch and leaves the rest in treasury.

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
- Dashboard reads Supabase; it does not need wallet secrets.
