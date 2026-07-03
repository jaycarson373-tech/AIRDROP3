# ANSEMIFICATION

Source token: `$ANSEMFY`
Reward token: `$ANSEM`

ANSEMIFICATION runs a creator-fee airdrop engine:

- Snapshot eligible `$ANSEMFY` holders.
- Claim creator fees.
- Use 80% of usable creator fees to buy `$ANSEM`.
- Airdrop `$ANSEM` automatically to eligible holders.
- Reserve the remaining 20% exclusively for holders using an Ansemified profile picture once verification is connected.

The site is an initiation page for the Cult of Ansem plus a live reward dashboard. Users tag `@Ansemfy_` on X to receive an Ansemified PFP.

## Environment

### Vercel

```bash
NEXT_PUBLIC_PROJECT_NAME=ANSEMIFICATION
NEXT_PUBLIC_SOURCE_SYMBOL=ANSEMFY
NEXT_PUBLIC_REWARD_SYMBOL=ANSEM
NEXT_PUBLIC_CA=2pAXiMcCVUum9zEC4FySjvMLPoaNbAec51s3wT3Spump
NEXT_PUBLIC_BUY_URL=https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=2pAXiMcCVUum9zEC4FySjvMLPoaNbAec51s3wT3Spump
NEXT_PUBLIC_SOURCE_TOKEN_MINT=2pAXiMcCVUum9zEC4FySjvMLPoaNbAec51s3wT3Spump
NEXT_PUBLIC_REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ANSEM_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ELIGIBILITY_LABEL=1M
NEXT_PUBLIC_X_URL=https://x.com/ANSEMFY
NEXT_PUBLIC_COMMUNITY_URL=https://x.com/i/communities/2029250283063394361
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

### Railway

```bash
REWARD_MODE=token
HELIUS_RPC_URL=<HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=<ANSEMFY_TOKEN_MINT>
REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
TREASURY_WALLET_SECRET=<BASE58_OR_JSON_SECRET_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
CLAIM_ENABLED=true
BUY_ENABLED=true
AIRDROP_ENABLED=true
EPOCH_MINUTES=5
ELIGIBILITY_MIN=1000000
MAX_WALLETS_PER_EPOCH=150
MAX_HOLDER_PCT=5
ANSEM_BUY_BPS=8000
SWAP_BALANCE_BPS=10000
SWAP_SLIPPAGE_BPS=1000
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE` and `AIRDROP_SOL_RESERVE` protect the SOL needed for transaction fees and token-account rent. They are operational reserves, not a separate strategy.

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
