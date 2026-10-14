# BRAINROT ($BRAINROT)

BRAINROT is the word of our generation turned into a Solana memecoin launching on Pump.fun. Its site pairs the meme archive with Oxford’s 2024 Word of the Year announcement, a Google Trends search-interest embed, and a DexScreener market panel.

The public site presents the Pump.fun launch and market-data flow:

1. launch `$BRAINROT` through Pump.fun;
2. configure the exact Solana pair in `NEXT_PUBLIC_DEXSCREENER_PAIR` to show the live chart; and
3. publish any separate holder rewards only with confirmed rules and verifiable Solana receipts.

The Google Trends panel measures search interest; Oxford University Press is the source for the Word of the Year designation and its reported usage data. Pump.fun does not administer any separate holder-reward program. The interface does not fabricate a settlement timer or reward promise.

## Legacy worker safety gates

The repository still contains an earlier standalone distribution worker. Its money-moving flags remain off by default and should not be enabled until a separate reward program, its rules, and its operating model are intentionally reviewed.

That legacy worker has a default `$NEURALINK` reward mint configured:

```text
PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S
```

This default is retained only for the parked worker. It does not configure a
reward promise or holder distribution on the Pump.fun launch site.

## Commands

```bash
npm run typecheck
npm run worker:test
npm run worker:build
npm run build
```

Platform-specific variable templates live in `deploy/vercel.env.example` and `deploy/railway.env.example`.
