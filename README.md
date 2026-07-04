# Bullify

Source token: `$BULLIFY`
Reward token: `$ANSEM`

Bullify turns profile pictures into Black Bull avatars and rewards the strongest bulls with `$ANSEM` airdrops.

## Reward Engine

- Snapshot eligible `$BULLIFY` holders.
- Claim creator fees.
- Run epochs every `10` minutes.
- Split usable creator fees after operational reserves:
  - `50%` buys `$ANSEM` for automatic holder airdrops.
  - `50%` is reserved for verified Bullified PFP holders.
- Airdrop `$ANSEM` automatically to eligible holders every 10 minutes.

Eligibility:

- Hold `500K+` `$BULLIFY`.
- No selling ever.
- Once a connected wallet sells any `$BULLIFY`, it loses eligibility for both 10-minute `$ANSEM` drops and Bullified PFP bonus drops.

## Vercel Environment

```bash
NEXT_PUBLIC_PROJECT_NAME=Bullify
NEXT_PUBLIC_SOURCE_SYMBOL=BULLIFY
NEXT_PUBLIC_REWARD_SYMBOL=ANSEM
NEXT_PUBLIC_CA=<BULLIFY_TOKEN_MINT>
NEXT_PUBLIC_BUY_URL=https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=<BULLIFY_TOKEN_MINT>
NEXT_PUBLIC_SOURCE_TOKEN_MINT=<BULLIFY_TOKEN_MINT>
NEXT_PUBLIC_REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ANSEM_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
NEXT_PUBLIC_ELIGIBILITY_LABEL=500K
NEXT_PUBLIC_X_URL=https://x.com/i/communities/2028470502415835347
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
```

## Railway Environment

```bash
REWARD_MODE=token
HELIUS_RPC_URL=<HELIUS_RPC_URL>
SOURCE_TOKEN_MINT=<BULLIFY_TOKEN_MINT>
REWARD_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
TREASURY_WALLET_SECRET=<BASE58_OR_JSON_SECRET_KEY>
SUPABASE_URL=<SUPABASE_URL>
SUPABASE_SERVICE_ROLE=<SUPABASE_SERVICE_ROLE_KEY>
CLAIM_ENABLED=true
BUY_ENABLED=true
AIRDROP_ENABLED=true
EPOCH_MINUTES=10
ELIGIBILITY_MIN=500000
MAX_WALLETS_PER_EPOCH=150
MAX_HOLDER_PCT=5
ANSEM_BUY_BPS=5000
PFP_REWARD_BPS=5000
PFP_REWARD_WALLET_PUBLIC_KEY=<BULLIFIED_PFP_BONUS_WALLET>
SWAP_BALANCE_BPS=10000
SWAP_SLIPPAGE_BPS=1000
MIN_SOL_RESERVE=0.3
AIRDROP_SOL_RESERVE=0.05
AIRDROP_BATCH_SIZE=4
AIRDROP_REWARD_BPS=10000
PRIORITY_FEE_SOL=0.000001
MIN_REWARD_RAW_TO_AIRDROP=1
```

`MIN_SOL_RESERVE` and `AIRDROP_SOL_RESERVE` protect SOL needed for fee claims, swaps to `$ANSEM`, payout fees, and token-account rent.

## Bullify Bot Prep

Railway bot responsibilities for `@Bullification_`:

- Monitor mentions/replies.
- Fetch the user's profile picture.
- Generate a Bullified version with black bull horns and premium Black Bull energy.
- Reply with the generated image.
- Log request status and generated PFP URL.
- Enforce duplicate protection and a cooldown per user.

The current site copy supports manual fulfillment while the bot worker is connected.

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
