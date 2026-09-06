# BRAINROT ($BRAINROT)

BRAINROT is the word of our generation turned into a Solana memecoin: launched through StonkFun and paired with the verified `$NEURAL` tokenized Neuralink asset.

The public site presents the StonkFun reward-pair flow:

1. launch `$BRAINROT` through StonkFun;
2. pair it with `$NEURAL`;
3. let the platform reward pot accumulate from trading activity; and
4. publish completed holder rewards with verifiable Solana receipts.

The interface uses five-minute tracking windows. Actual reward settlement depends on StonkFun reward-pot thresholds and platform execution. No wallet signature, approval, or manual claim is required for holder rewards.

## Legacy worker safety gates

The repository still contains the earlier standalone distribution worker. Its money-moving flags remain off by default and should not be enabled for a StonkFun-managed reward launch unless the operating model is intentionally changed and reviewed.

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
