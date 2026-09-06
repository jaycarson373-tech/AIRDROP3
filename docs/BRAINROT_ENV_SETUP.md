# BRAINROT environment setup

## Supabase

Apply every migration in `supabase/migrations` in numeric order. Existing
installations must apply `014_dual_reward_split.sql` before the BRAINROT worker
starts. That migration preserves verifiable reward-buy rows and payout identity
for each reward mint. Apply `015_sell_once_ineligible.sql` before enabling the
worker so stored holder state keeps the sell-once ineligibility rule.

## Railway

Start from `deploy/railway.env.example`. The fixed reward configuration is:

```text
REWARD_MODE=token
NEURAL_MINT=PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S
REWARD_TOKEN_MINT=PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S
REWARD_TOKEN_SYMBOLS=NEURAL
EPOCH_MINUTES=5
```

Keep `WORKER_ENABLED`, `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED`
false until the final $BRAINROT mint, eligibility threshold, excluded wallets,
treasury reserve, swap slippage, retry settings, and minimum distribution
threshold have been reviewed in a dry cycle.

## Vercel

Start from `deploy/vercel.env.example`. Set the final site URL, $BRAINROT mint,
project X account, exact StonkFun token URL, explicit buy URL, eligibility threshold, and Supabase values.
Set `NEXT_PUBLIC_STONK_URL` to the final StonkFun token page after launch; the
template points to the StonkFun launchpad until that URL exists.
The built-in `/api/stats` endpoint supplies rewards and leaderboard data; only
set `NEXT_PUBLIC_REWARD_API_URL` or `NEXT_PUBLIC_LEADERBOARD_API_URL` when
replacing it with a compatible public read API.

Never expose the Helius URL, service-role key, treasury secret, or any signing
authority through a `NEXT_PUBLIC_` variable.
