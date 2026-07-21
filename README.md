# Scout

Scout is a Solana attention-intelligence platform and transparent holder-distribution protocol.

It records authenticated token signals, enriches them with connected market data, ranks them with explainable factors, releases qualified-holder access before the public feed, and can hand the active signal to the existing five-minute treasury worker.

## Product surfaces

- `/terminal` - live signal desk and explainable Scout Score
- `/runners` - released signal database
- `/search` - structured natural-language search over recorded signals
- `/performance` - selection history without invented returns
- `/airdrop-history` - settled epoch and transaction receipts
- `/api` - API pilot documentation
- `/pricing` - product tiers; billing is not yet connected
- `/docs` - Telegram, access, and protocol documentation
- `/admin` - authenticated signal and policy controls

## Holder rules

- Minimum balance: `2,500,000 SCOUT`
- Epoch cadence: five minutes
- Wallets above `MAX_HOLDER_PCT` are excluded
- A balance decrease resets the epoch streak and multiplier to `1.00x`
- A wallet becomes eligible again whenever its balance returns above the threshold

## Signal handoff

Scout accepts signals only through an authenticated admin request or an allowlisted Telegram source. Automatic activation is deterministic and uses configured score, liquidity, active-time, and score-margin floors. An administrator can explicitly activate a verified signal.

When `SCOUT_DYNAMIC_SELECTION_ENABLED=true`, the active Scout signal becomes the reward mint at the start of the next epoch. Leave this disabled until the Scout migration has run and an active signal has been verified.

## Safe launch order

1. Rotate any credential that has ever been pasted into chat, logs, or screenshots.
2. Keep `CLAIM_ENABLED`, `BUY_ENABLED`, `AIRDROP_ENABLED`, and `SCOUT_DYNAMIC_SELECTION_ENABLED` false.
3. Run `supabase/migrations/007_scout_platform.sql`.
4. Run `supabase/reset_scout_launch.sql` if this database contains data from an earlier project.
5. Configure the Scout source mint, Supabase, RPC, Telegram, and treasury secrets.
6. Submit the first verified runner and confirm it appears in `/admin`, `/terminal`, and `/api/scout/signals`.
7. Enable dynamic selection and run a controlled dry epoch with treasury gates still off.
8. Fund reserves, then enable claim, buy, and airdrop gates in a monitored deployment.

The Railway configuration intentionally starts with a kill switch. Replace its start command with `npm run worker:start` only after the launch checklist is complete.

## Verification

```bash
npm run check
```

Never expose `SUPABASE_SERVICE_ROLE`, `SCOUT_ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, or `TREASURY_WALLET_SECRET` through a `NEXT_PUBLIC_` variable.
