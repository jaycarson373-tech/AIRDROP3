# Pump Money ($PMONEY)

Pump Money is a five-minute Solana holder-draw protocol for $PMONEY holders. Each completed cycle:

1. snapshots the eligible Pump Money holder set;
2. applies a weighted draw where balance and continuous holding improve selection weight;
3. selects up to ten unique wallets;
4. divides the available PUMP reward pool equally across those wallets; and
5. publishes only settled, verifiable Solana receipts.

Detected selling is handled by the holder-state policy before the draw. Selection is weighted, deterministic for audit/replay, and never guaranteed. No wallet connection, signature, approval, or manual claim is required.

The final Pump Money mint, PUMP reward mint, X account, and eligibility threshold remain unset until confirmed.

## Safety gates

All money-moving worker flags default off. Configure the final source mint, PUMP reward mint, holder threshold, exclusions, and Supabase schema; run and inspect a dry cycle before enabling claims, buys, airdrops, or the worker.

## Commands

```bash
npm run typecheck
npm run worker:test
npm run worker:build
npm run build
```

Platform-specific variable templates live in `deploy/vercel.env.example` and `deploy/railway.env.example`.
