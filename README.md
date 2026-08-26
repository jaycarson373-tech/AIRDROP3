# Pump Money

Pump Money turns confirmed pump.fun creator fees into automatic PUMP reward rounds for eligible PMONEY holders.

## Round

Every five minutes the Railway worker:

1. Claims creator fees and measures the treasury balance increase.
2. Snapshots eligible PMONEY holders.
3. Updates each wallet's uninterrupted holding multiplier.
4. Buys the configured, verified PUMP mint through Jupiter.
5. Selects up to ten wallets using a finalized Solana blockhash seed and loyalty-weighted odds.
6. Splits only the PUMP purchased in that round equally between the selected wallets.
7. Simulates transfers, confirms settlement, and publishes receipts through Supabase.

A balance decrease resets the wallet's holding streak and multiplier to 1.0x. It does not permanently ban the wallet.

## Safety

- `WORKER_ENABLED=false` is the default.
- Claim, buy, and airdrop gates default to false in code.
- The creator-fee transaction must name the treasury as its only signer and fee payer.
- Fee-claim transactions using address lookup tables or unknown programs are rejected.
- Claim, swap, and payout transactions are simulated before broadcast.
- Pre-existing PUMP in the treasury is not included in a round's reward pool.
- Real payouts are the only payouts exposed through the public Supabase policy.

## Launch order

1. Rotate any previously shared treasury, Helius, and Supabase service credentials.
2. Apply `supabase/migrations/001_pump_airdrop.sql` through `006_pump_money.sql` in order.
3. Run `supabase/reset_pump_money.sql` if the project previously stored another token's rounds.
4. Set the verified PMONEY source mint and verified PUMP reward mint.
5. Deploy with all worker gates false and confirm the heartbeat is `paused`.
6. Set `WORKER_ENABLED=true` with claim, buy, and airdrop still false for one dry-run epoch.
7. Review the snapshot and planned math.
8. Enable claim and buy with airdrops still false for a controlled purchase test.
9. Enable airdrops only after the transaction summary and treasury reserves are confirmed.

## Commands

```bash
npm run check
npm run worker:dev
npm run worker:start
```
