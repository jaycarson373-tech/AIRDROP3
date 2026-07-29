# Casino

Casino is a red-and-black, pixel-era Solana tournament interface. Every
eligible holder is entered automatically—there is no wallet connection or
manual game entry.

Each round lasts five minutes and rotates through one of ten deterministic
game simulations. Verified randomness commits the field and results. The
weakest results are revealed first, with the top three reserved for the podium.

## Round policy

- 80% of claimed creator fees funds the current round.
- The top three split the round pool 50% / 30% / 20%.
- 20% accumulates in the jackpot ledger.
- Every 25th settled round adds the jackpot to first place.
- Eligibility begins at 1,000,000 `$CASINO`.

## Local checks

```bash
npm ci
npm run check
```

## Deployment

- Vercel hosts the Next.js interface.
- Railway runs the round worker.
- Supabase stores immutable snapshots, rounds, results, winners, and chat.
- The worker must remain payout-disabled until migrations `010`–`013`, the
  built-in Switchboard commitment/reveal writer, and a complete proof-verified
  dry run are verified.

See `docs/CASINO_ENV_SETUP.md` and `docs/CASINO_LAUNCH.md`.
