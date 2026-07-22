# Runner Index 6900

RI6900 records verified index components and powers five-minute, multiplier-weighted distributions for eligible Runner Index 6900 holders.

Each recorded call keeps its market cap at scan time. The site reads current market cap from DexScreener so the scan ledger can show live performance without overwriting the original snapshot.

## Product surfaces

- `/terminal` - live RI6900 terminal and index output
- `/runners` - complete verified scan ledger
- `/search` - search recorded RI6900 components
- `/performance` - scan history without invented returns
- `/airdrop-history` - settled epoch and transaction receipts
- `/docs` - scanner, multiplier, and distribution rules

## Holder rules

- Minimum balance: `1,000,000 RI6900`
- Epoch cadence: five minutes
- Wallets above `MAX_HOLDER_PCT` are excluded
- A balance decrease resets the epoch streak and multiplier to `1.00x`
- A wallet becomes eligible again whenever its balance returns above the threshold

## Manual scan workflow

Run `supabase/manual_runner_scan_setup.sql` once in Supabase SQL Editor. For every new call, copy `supabase/record_runner_scan.sql`, replace its six values, and run the transaction. Record the token name, symbol, Solana mint, market cap at scan, scan time with timezone, and selection note.

When `SCOUT_DYNAMIC_SELECTION_ENABLED=true`, the active RI6900 component becomes the reward mint at the start of the next epoch. Leave this disabled until the scan setup has run and an active component has been verified.

## Safe launch order

1. Rotate any credential that has ever been pasted into chat, logs, or screenshots.
2. Keep `CLAIM_ENABLED`, `BUY_ENABLED`, `AIRDROP_ENABLED`, and `SCOUT_DYNAMIC_SELECTION_ENABLED` false.
3. Run `supabase/manual_runner_scan_setup.sql`.
4. Configure the RI6900 source mint, Supabase, RPC, and treasury secrets.
5. Record the first verified component and confirm it appears in `/runners`, `/terminal`, and `/api/scout/signals`.
6. Enable dynamic selection and run a controlled dry epoch with treasury gates still off.
7. Fund reserves, then enable claim, buy, and airdrop gates in a monitored deployment.

The Railway configuration intentionally starts with a kill switch. Replace its start command with `npm run worker:start` only after the launch checklist is complete.

## Verification

```bash
npm run check
```

Never expose `SUPABASE_SERVICE_ROLE`, `SCOUT_ADMIN_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, or `TREASURY_WALLET_SECRET` through a `NEXT_PUBLIC_` variable.
