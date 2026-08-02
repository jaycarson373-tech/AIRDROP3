# GOAT environment setup

## Supabase

Apply every migration in `supabase/migrations` in numeric order. Existing
installations must apply `014_dual_reward_split.sql` before the GOAT worker
starts. That migration allows ANSEM and CATE to have separate payout rows in
the same five-minute cycle and creates the public settled-buy ledger.

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
`NEXT_PUBLIC_POORGOAT_WALLET_URL` should be the public explorer link used by
the Portfolio button.
Never expose the Helius URL, service-role key, or treasury secret through a
`NEXT_PUBLIC_` variable.
