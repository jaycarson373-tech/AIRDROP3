# Cat Strat

Cat Strat is a live cat-runner reward site for `CSTR`. Eligible holders receive the configured cat-token runner on the live epoch cadence.

The active reward asset defaults to:

- `CAT`

## Product Surfaces

- `/terminal` - live Cat Strat dashboard and active cat-runner status
- `/runners` - cat runner ledger and recorded selections
- `/search` - search recorded cat runner assets
- `/performance` - cat runner history without invented returns
- `/airdrop-history` - settled epoch and transaction receipts
- `/docs` - eligibility and distribution rules

## Holder Rules

- Minimum balance: `1,000,000 CSTR`
- Epoch cadence: five minutes
- Wallets above `MAX_HOLDER_PCT` are excluded
- Selling or transferring below the tracked balance resets holder multiplier progress back to base

## Safe Launch Order

1. Rotate any credential that has ever been pasted into chat, logs, or screenshots.
2. Keep `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED` false until the public CA, reward mints, treasury, RPC, and Supabase settings are verified.
3. Configure the Cat Strat source mint, Supabase, RPC, treasury secrets, and active `CAT` reward mint.
4. Confirm the public site shows the Cat Strat CA, X community link, buy link, reward basket, and no stale project links.
5. Run a controlled dry epoch with treasury gates still off.
6. Fund reserves, then enable claim, buy, and airdrop gates in a monitored deployment.

The Railway configuration intentionally starts with a kill switch. Replace its start command with `npm run worker:start` only after the launch checklist is complete.

## Verification

```bash
npm run check
```

Never expose `SUPABASE_SERVICE_ROLE`, `SCOUT_ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, or `TREASURY_WALLET_SECRET` through a `NEXT_PUBLIC_` variable.
