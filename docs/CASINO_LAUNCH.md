# Casino settlement launch checklist

Casino Strategy runs fifteen-minute rounds with this fixed policy:

- 80% of each round's net claimed creator fees funds the top three.
- The round pool splits 50% / 30% / 20%.
- 20% carries in the jackpot ledger.
- Every 25th settled round adds the full jackpot to first place.

## Required before enabling payouts

1. Apply `supabase/migrations/010_casino_rounds.sql`, `supabase/migrations/011_casino_gameplay_chat.sql`, and `supabase/migrations/012_casino_tournament_feed.sql`.
2. Deploy an app-owned Switchboard commit/reveal integration that:
   - commits the round ID and eligible-wallet snapshot before reveal;
   - writes the Switchboard account, commit slot, commit transaction, reveal transaction, and 32-byte revealed value to `casino_rounds`;
   - sets `randomness_verified_at` only after on-chain verification;
   - cannot silently discard and replace an unfavorable committed round.
3. Run the worker with all money-moving flags off and verify a complete dry-run round.
4. Confirm the treasury has the permanent reserve, transaction reserve, current round pool, and accumulated jackpot.
5. Review the launch jurisdiction, eligibility rules, age restrictions, and required disclosures with qualified counsel.

The worker deliberately refuses to select or display winners without the complete Switchboard proof. It also writes the signed top-three settlement transaction before broadcast, allowing a restart to recover or safely replay the same transaction instead of double-paying.

After a proof is verified, the worker deterministically speed-runs every wallet in the immutable eligibility snapshot through the active game. The persisted fifteen-minute tournament schedule eliminates the weakest verified results first and reserves the top three for the final reveal. Ten-player fields cut to 8, 5, and 3; 100-player fields cut to 32, 10, and 3; 1,000-player fields cut to 100, 25, 10, and 3. Client timing cannot affect the winners. The ten game engines are PONG, CRASH, ROULETTE, DUEL, COINFLIP, DICE, PLINKO, MINES, HI-LO, and SLOTS.

Live chat is disabled by default. To enable it after migration 011, set `CASINO_CHAT_ENABLED=true`, keep the Supabase service role server-side, and set a long random `CASINO_CHAT_RATE_LIMIT_SALT`. The server stores only a salted client fingerprint for rate limiting; it does not store raw IP addresses.

## Worker policy

```dotenv
REWARD_MODE=sol
EPOCH_MINUTES=15
CASINO_ROUND_MINUTES=15
CASINO_ROUND_PAYOUT_BPS=8000
CASINO_JACKPOT_BPS=2000
CASINO_TOP3_SPLIT_BPS=5000,3000,2000
CASINO_JACKPOT_INTERVAL=25
CASINO_WORKER_POLL_MS=5000

CASINO_MODE_ENABLED=false
CASINO_PAYOUTS_ENABLED=false
CASINO_CHAT_ENABLED=false
CASINO_CHAT_RATE_LIMIT_SALT=
CLAIM_ENABLED=false
BUY_ENABLED=false
AIRDROP_ENABLED=false
```

Enable `CASINO_MODE_ENABLED` only after the migration and proof writer are deployed. Enable `CLAIM_ENABLED`, `CASINO_PAYOUTS_ENABLED`, and `AIRDROP_ENABLED` only after the dry run and an explicit mainnet transaction review. `BUY_ENABLED` remains false because casino settlements are paid in SOL.
