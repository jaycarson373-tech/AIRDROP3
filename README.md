# Cat in Hood

Source token: `$CAT`
Reward token: `$HOODx`

Cat in Hood routes creator fees into proportional HOODx Stock airdrops for eligible holders every 5 minutes.

## Reward Engine

- Snapshot eligible `$CAT` holders.
- Claim creator fees.
- Buy the configured HOODx reward token.
- Airdrop rewards automatically to eligible 1M+ holders every 5 minutes.
- Exclude wallets holding 5%+ of supply from reward snapshots.
- Record proof in Supabase for the site.

## Vercel Environment

```bash
NEXT_PUBLIC_PROJECT_NAME=Cat in Hood
NEXT_PUBLIC_SOURCE_SYMBOL=CAT
NEXT_PUBLIC_REWARD_SYMBOL=HOODx
NEXT_PUBLIC_CA=FJp7vevpWNU4swprwtpTd5LDTKrnmmy1qe9vitdpump
NEXT_PUBLIC_BUY_URL=https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=FJp7vevpWNU4swprwtpTd5LDTKrnmmy1qe9vitdpump
NEXT_PUBLIC_SOURCE_TOKEN_MINT=FJp7vevpWNU4swprwtpTd5LDTKrnmmy1qe9vitdpump
NEXT_PUBLIC_REWARD_TOKEN_MINT=XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg
NEXT_PUBLIC_ELIGIBILITY_LABEL=1M
NEXT_PUBLIC_EPOCH_MINUTES=5
NEXT_PUBLIC_X_URL=https://x.com/catinhood__
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

## Railway Environment

```bash
REWARD_MODE=token
HELIUS_RPC_URL=<HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=FJp7vevpWNU4swprwtpTd5LDTKrnmmy1qe9vitdpump
REWARD_TOKEN_MINT=XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg
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
SWAP_BALANCE_BPS=10000
SWAP_SLIPPAGE_BPS=1000
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
ANSEM_BUY_BPS=10000
PFP_REWARD_BPS=0
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE` and `AIRDROP_SOL_RESERVE` protect SOL needed for fee claims, swaps, payout fees, and token-account rent.

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
