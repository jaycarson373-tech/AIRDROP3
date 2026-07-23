# Buffettcoin

Buffettcoin presents a professional holder distribution site for a Buffett-inspired portfolio basket. Eligible holders receive the configured reward basket on the live epoch cadence.

The initial reward basket is:

- `AAPL.x`
- `BRK.Bx`

## Product Surfaces

- `/terminal` - live Buffettcoin dashboard and basket status
- `/runners` - basket ledger and recorded selections
- `/search` - search recorded basket assets
- `/performance` - basket history without invented returns
- `/airdrop-history` - settled epoch and transaction receipts
- `/docs` - eligibility and distribution rules

## Holder Rules

- Minimum balance: `1,000,000 BUFFETT`
- Epoch cadence: five minutes
- Wallets above `MAX_HOLDER_PCT` are excluded
- Selling or transferring below the tracked balance marks the wallet ineligible according to the configured holder-state rules

## Safe Launch Order

1. Rotate any credential that has ever been pasted into chat, logs, or screenshots.
2. Keep `CLAIM_ENABLED`, `BUY_ENABLED`, and `AIRDROP_ENABLED` false until the public CA, reward mints, treasury, RPC, and Supabase settings are verified.
3. Configure the Buffettcoin source mint, Supabase, RPC, treasury secrets, and the 50/50 `AAPL.x` / `BRK.Bx` reward mint rotation.
4. Confirm the public site shows the Buffettcoin CA, X community link, buy link, reward basket, and no stale project links.
5. Run a controlled dry epoch with treasury gates still off.
6. Fund reserves, then enable claim, buy, and airdrop gates in a monitored deployment.

The Railway configuration intentionally starts with a kill switch. Replace its start command with `npm run worker:start` only after the launch checklist is complete.

## Verification

```bash
npm run check
```

Never expose `SUPABASE_SERVICE_ROLE`, `SCOUT_ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, or `TREASURY_WALLET_SECRET` through a `NEXT_PUBLIC_` variable.
