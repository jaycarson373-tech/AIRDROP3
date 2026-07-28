# Casino Strategy environment setup

Use different values for placeholders. Never paste treasury secrets into Vercel, GitHub, chat, or any `NEXT_PUBLIC_` variable.

## Supabase

For the existing project, run these files in the Supabase SQL editor in order:

1. `supabase/migrations/010_casino_rounds.sql`
2. `supabase/migrations/011_casino_gameplay_chat.sql`
3. `supabase/migrations/012_casino_tournament_feed.sql`

For an empty Supabase project, apply every numbered migration from `001` through `012` in order because the casino tables reference the base `epochs`, `snapshots`, `payouts`, and holder-state tables.

Migration 011 creates:

- `casino_game_results`
- `casino_chat_messages`
- `casino_public_rounds`
- `casino_public_current_play`
- playback/result-commitment columns on `casino_rounds`

Migration 012 narrows the public current-play view so the upcoming wallet can be animated without exposing its score or outcome before reveal.

## Railway worker

Build command: `npm ci && npm run worker:build`  
Start command: `npm run worker:start`

The copy-ready Railway template is `deploy/railway.env.example`.

Start with money movement disabled:

```dotenv
REWARD_MODE=sol
HELIUS_RPC_URL=<NEW_PRIVATE_HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=<CASINO_TOKEN_MINT>
TREASURY_WALLET_SECRET=<NEW_ROTATED_BASE58_SECRET>
SUPABASE_URL=<SUPABASE_PROJECT_URL>
SUPABASE_SERVICE_ROLE=<NEW_ROTATED_SERVICE_ROLE_KEY>

EPOCH_MINUTES=15
CASINO_ROUND_MINUTES=15
CASINO_WORKER_POLL_MS=5000
CASINO_ROUND_PAYOUT_BPS=8000
CASINO_JACKPOT_BPS=2000
CASINO_TOP3_SPLIT_BPS=5000,3000,2000
CASINO_JACKPOT_INTERVAL=25

ELIGIBILITY_MIN=1000000
MAX_WALLETS_PER_EPOCH=1000
MAX_HOLDER_PCT=4
EXCLUDE_WALLETS=
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
MIN_REWARD_RAW_TO_AIRDROP=1
PRIORITY_FEE_SOL=0.000001

SCOUT_DYNAMIC_SELECTION_ENABLED=false
BUY_ENABLED=false
CLAIM_ENABLED=false
AIRDROP_ENABLED=false
CASINO_MODE_ENABLED=false
CASINO_PAYOUTS_ENABLED=false
```

After migrations, an end-to-end dry run, treasury review, and the app-owned Switchboard commitment/reveal writer are deployed, enable the worker in stages:

```dotenv
CASINO_MODE_ENABLED=true
CLAIM_ENABLED=true
```

Keep these off during the dry run:

```dotenv
AIRDROP_ENABLED=false
CASINO_PAYOUTS_ENABLED=false
```

Only after reviewing a complete verified dry-run round and explicitly approving mainnet settlement:

```dotenv
AIRDROP_ENABLED=true
CASINO_PAYOUTS_ENABLED=true
```

`BUY_ENABLED` stays `false`; casino prizes are settled in SOL.

## Vercel web application

The copy-ready Vercel template is `deploy/vercel.env.example`.

```dotenv
LAUNCH_STATE=live
NEXT_PUBLIC_PROJECT_NAME="Casino Strategy"
NEXT_PUBLIC_SOURCE_SYMBOL=CASINO
NEXT_PUBLIC_CA=<CASINO_TOKEN_MINT>
NEXT_PUBLIC_SOURCE_TOKEN_MINT=<CASINO_TOKEN_MINT>
NEXT_PUBLIC_BUY_URL=https://pump.fun/coin/<CASINO_TOKEN_MINT>
NEXT_PUBLIC_DEXSCREENER_URL=https://dexscreener.com/solana/<CASINO_TOKEN_MINT>
NEXT_PUBLIC_X_URL=<CASINO_X_URL>
NEXT_PUBLIC_SITE_URL=https://www.casinostrategy.fun
NEXT_PUBLIC_ELIGIBILITY_MIN=1000000
NEXT_PUBLIC_ELIGIBILITY_LABEL=1M
NEXT_PUBLIC_EPOCH_MINUTES=15
NEXT_PUBLIC_REWARD_SYMBOL=SOL

NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_URL=<SUPABASE_PROJECT_URL>
SUPABASE_SERVICE_ROLE=<NEW_ROTATED_SERVICE_ROLE_KEY>

SOURCE_TOKEN_MINT=<CASINO_TOKEN_MINT>
ELIGIBILITY_MIN=1000000
MAX_HOLDER_PCT=4
HELIUS_RPC_URL=<NEW_PRIVATE_HELIUS_RPC_URL>

CASINO_CHAT_ENABLED=true
CASINO_CHAT_RATE_LIMIT_SALT=<LONG_RANDOM_SECRET>
```

Never put `SUPABASE_SERVICE_ROLE`, `HELIUS_RPC_URL`, `CASINO_CHAT_RATE_LIMIT_SALT`, or `TREASURY_WALLET_SECRET` in `NEXT_PUBLIC_` variables.

Do not reuse the previous CSTR contract, X account, or buy URL. Until the real
Casino Strategy values are configured, the web application intentionally hides
those controls instead of displaying a stale fallback.

## Required proof service

The current repository validates complete Switchboard proof fields before computing or paying winners, but it does not yet contain the app-owned process that commits and reveals Switchboard randomness. Do not enable payout flags until that writer is deployed and a verified dry-run round completes.
