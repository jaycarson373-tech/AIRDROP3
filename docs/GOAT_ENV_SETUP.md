# GOAT environment setup

## Supabase

Apply every migration in `supabase/migrations` in numeric order. Existing
installations must apply `014_dual_reward_split.sql` before the GOAT worker
starts. That migration allows ANSEM and CATE to have separate payout rows in
the same five-minute cycle and creates the public settled-buy ledger.
Apply `015_sell_once_ineligible.sql` before enabling the worker. It preserves
the sell-once rule in stored holder state: any detected raw balance decrease
permanently ends eligibility for that wallet.

## Railway

Start from `deploy/railway.env.example`. The fixed dual-reward configuration is:

```text
REWARD_MODE=token
REWARD_TOKEN_MINTS=<ANSEM_CA>,<CATE_CA>
REWARD_TOKEN_SYMBOLS=ANSEM,CATE
REWARD_TOKEN_SPLIT_BPS=5000,5000
EPOCH_MINUTES=5
```

Keep `WORKER_ENABLED`, `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED`
false until the final GOAT mint, supply-derived threshold, excluded wallets,
and treasury reserve have been reviewed in a dry cycle.

## Vercel

Start from `deploy/vercel.env.example`. Set the final site URL, GOAT mint,
project X account, explicit buy URL, Poor Goat wallet URL, supply-derived
eligibility threshold, and Supabase values. `NEXT_PUBLIC_BUY_URL` may be left
empty when `NEXT_PUBLIC_CA` is set; the site then derives the Jupiter swap URL.
`NEXT_PUBLIC_POOR_GOAT_X_URL`, `NEXT_PUBLIC_POOR_GOAT_WALLET_URL`, and
`NEXT_PUBLIC_POOR_GOAT_PROOF_URL` control the optional Poor Goat profile card
actions. Empty values are hidden. The built-in `/api/stats` endpoint supplies
rewards and leaderboard data; only set `NEXT_PUBLIC_REWARD_API_URL` or
`NEXT_PUBLIC_LEADERBOARD_API_URL` when replacing it with a compatible public
read API.
Never expose the Helius URL, service-role key, or treasury secret through a
`NEXT_PUBLIC_` variable.
