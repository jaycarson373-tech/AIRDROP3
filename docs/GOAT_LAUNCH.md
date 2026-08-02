# GOAT launch checklist

1. Confirm the final GOAT supply, mint, X account, treasury public address,
   eligibility threshold, and maximum-holder rule.
2. Apply Supabase migration `014_dual_reward_split.sql`.
3. Deploy Vercel with `LAUNCH_STATE=prelaunch`.
4. Deploy Railway with all money-moving flags false.
5. Run one dry cycle and verify the planned reward budget is split exactly
   5,000 / 5,000 basis points between ANSEM and CATE.
6. Confirm both mints resolve to supported SPL token programs and both Jupiter
   quotes simulate from the treasury.
7. Confirm the treasury retains the permanent SOL reserve plus ATA and transfer
   fees for both reward assets.
8. Enable claim, buy, and airdrop gates only after reviewing the transaction
   summary and dry-run payout rows.
9. Enable the worker last, then set `LAUNCH_STATE=live` only after the first
   settled cycle appears in the public receipt ledger.

No mainnet transaction should be signed or sent as part of repository setup.
