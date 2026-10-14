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

Start from `deploy/vercel.env.example`. Keep `BRAINROT_LAUNCH_STATE=prelaunch`
until the token page is available. After launch, set `NEXT_PUBLIC_PUMPFUN_URL`
to the canonical token page and `NEXT_PUBLIC_BRAINROT_MINT` to its verified
mint. The header button changes to `GET ROT` only when the token page URL is
configured. Set `NEXT_PUBLIC_DEXSCREENER_PAIR` only after confirming the exact
Solana pair; otherwise the chart remains in standby.

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BRAINROT_X_URL` when those public
links are known. Supabase and Helius settings are only needed for the optional
historical holder and distribution APIs. They are not required for the Pump.fun
launch page, Oxford source link, Google Trends chart, or DexScreener embed.
Keep the legacy Railway distribution worker disabled unless a separate reward
program, its rules, and its funded payout process are intentionally approved.

Never expose the Helius URL, service-role key, treasury secret, or any signing
authority through a `NEXT_PUBLIC_` variable.
