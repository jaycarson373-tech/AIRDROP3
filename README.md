# GOAT

GOAT is a five-minute Solana holder-distribution protocol built around the
PoorGoat story. Each completed cycle uses one immutable GOAT holder snapshot
and splits the configured reward-buy budget exactly 50/50:

- 50% buys and distributes `$ANSEM`.
- 50% buys and distributes `$CATE`.
- Both assets use the same eligible holder set.
- Public amounts appear only after their Solana transactions settle.
- No wallet connection, signature, approval, or manual claim is required.

The final GOAT mint and eligibility threshold are intentionally unset until
the token supply is confirmed.

## Safety gates

Money-moving worker flags default off. Apply every numbered Supabase migration
through `014_dual_reward_split.sql`, configure the final GOAT mint and holder
threshold, run a dry cycle, and inspect both asset allocations before enabling
claims, buys, airdrops, and the worker.

## Commands

```bash
npm run typecheck
npm run worker:test
npm run worker:build
npm run build
```

Platform-specific variable templates live in `deploy/vercel.env.example` and
`deploy/railway.env.example`.
