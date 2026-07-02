# Bull Strategy

Source token: `$BULLSTRAT`
Reward token: `$ANSEM`

Bull Strategy runs two engines from creator fees:

- 50% buys `$ANSEM` and airdrops it to eligible `$BULLSTRAT` holders.
- 50% is reserved for the SOL long strategy side. Realized SOL-long profits are intended to buy back and burn `$BULLSTRAT`.

The ANSEM airdrop path is live in this repo. The SOL long, PnL, buyback, and burn panels intentionally show "awaiting live integration" until real position and burn transactions are wired in.

## Flow

Every epoch:

1. Claim creator fees to the treasury wallet.
2. Snapshot `$BULLSTRAT` holders with at least `ELIGIBILITY_MIN`.
3. Exclude treasury, curve/pool addresses, `EXCLUDE_WALLETS`, holders above `MAX_HOLDER_PCT`, and wallets that lost eligibility.
4. Keep protected SOL reserves before strategy actions.
5. Split usable SOL with `ANSEM_BUY_BPS=5000`.
6. Use the ANSEM side to buy `$ANSEM`.
7. Airdrop `$ANSEM` to selected eligible `$BULLSTRAT` holders.
8. Keep the remaining usable SOL reserved for the SOL long strategy side.
9. Pick one selected recipient as the separate 5x strategy bonus winner when balance allows.
10. Store epochs, snapshots, claims, reward pools, bonus fields, and payouts in Supabase for the dashboard.

## Weighting

The live airdrop weight is based on `$BULLSTRAT` held. Larger eligible holders receive a larger base share. The old lower-SOL-balance / smaller-holder tilt is not used for Bull Strategy.

Default eligibility is `250000` `$BULLSTRAT`. The dashboard label should be `250K`, but the live worker uses `ELIGIBILITY_MIN` as the source of truth.

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

select
  (select count(*) from public.epochs) as epochs,
  (select count(*) from public.claims) as claims,
  (select count(*) from public.buys) as buys,
  (select count(*) from public.payouts) as payouts,
  (select count(*) from public.snapshots) as snapshots;
```

If your Supabase project has `holder_states`, this extra check should return `0` too:

```sql
select count(*) as holder_states from public.holder_states;
```

## Vercel Env

Required:

```bash
NEXT_PUBLIC_PROJECT_NAME="Bull Strategy"
NEXT_PUBLIC_CA=<BULLSTRAT_MINT>
NEXT_PUBLIC_SOURCE_SYMBOL=BULLSTRAT
NEXT_PUBLIC_REWARD_SYMBOL=ANSEM
NEXT_PUBLIC_SOURCE_TOKEN_MINT=<BULLSTRAT_MINT>
NEXT_PUBLIC_REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ANSEM_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ELIGIBILITY_LABEL=250K
NEXT_PUBLIC_X_URL=<PROJECT_X_URL>
NEXT_PUBLIC_BUY_URL=https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=<BULLSTRAT_MINT>
NEXT_PUBLIC_DEX_URL=<DEXSCREENER_PAIR_OR_TOKEN_URL>
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
SOURCE_TOKEN_MINT=<BULLSTRAT_MINT>
REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
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

Keep `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED` true for the live BULLSTRAT -> ANSEM airdrop flow. Turn `AIRDROP_ENABLED=false` only when you want claims and swaps to run without sending rewards.

Strategy settings:

```bash
EPOCH_MINUTES=5
ELIGIBILITY_MIN=250000
MAX_WALLETS_PER_EPOCH=150
MAX_HOLDER_PCT=5
EXCLUDE_WALLETS=
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
ANSEM_BUY_BPS=5000
SWAP_BALANCE_BPS=10000
SWAP_SLIPPAGE_BPS=1000
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE=0.3` keeps at least 0.30 SOL untouched. `AIRDROP_SOL_RESERVE=0.05` preserves the post-airdrop transaction/rent buffer. `ANSEM_BUY_BPS=5000` caps the ANSEM buy side at 50% of usable SOL after reserves. The remainder stays reserved for the SOL long strategy side. `AIRDROP_REWARD_BPS=10000` distributes the available ANSEM reward balance each epoch after payout reserve checks.

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

- All live money movement can still be gated by env flags.
- A failed claim logs and continues; it does not crash-loop the worker.
- Epochs are idempotent by `epoch_id`.
- Payouts are idempotent by `epoch_id:wallet`.
- In `REWARD_MODE=token`, the worker calls Jupiter for the reward-token swap and creates holder token accounts idempotently when needed.
- The worker protects the permanent reserve and payout buffer before calculating the ANSEM buy split.
- Dashboard reads Supabase; it does not need wallet secrets.
