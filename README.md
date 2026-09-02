# BRAINROT ($BRAINROT)

BRAINROT is a five-minute Solana holder reward protocol. Each completed cycle:

1. snapshots the eligible $BRAINROT holder set;
2. applies the existing holder-allocation logic;
3. claims accrued creator fees server-side;
4. buys the verified $NEURAL PreStocks asset on Solana; and
5. distributes settled, verifiable $NEURAL receipts to eligible holders.

Distributions run on fixed five-minute UTC epochs. If fees or purchased rewards are below the configured threshold, the epoch is recorded as skipped and the site displays "No distribution this epoch." No wallet signature, approval, or manual claim is required for holder rewards.

## Safety Gates

All money-moving worker flags default off. Configure the verified $BRAINROT source mint, the official $NEURAL reward mint, holder threshold, exclusions, Supabase schema, retry settings, slippage, fee reserves, and emergency pause state; then run and inspect a dry cycle before enabling claims, buys, airdrops, or the worker.

The official $NEURAL mint configured by default is:

```text
PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S
```

## Commands

```bash
npm run typecheck
npm run worker:test
npm run worker:build
npm run build
```

Platform-specific variable templates live in `deploy/vercel.env.example` and `deploy/railway.env.example`.
