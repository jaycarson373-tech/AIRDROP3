# BRAINROT launch checklist

1. Confirm the final $BRAINROT supply, mint, X account, treasury public address,
   eligibility threshold, maximum-holder rule, and excluded wallets.
2. Confirm the official $NEURAL mint is configured as
   `PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S`.
3. Apply Supabase migrations through `015_sell_once_ineligible.sql`.
4. Deploy Vercel with `BRAINROT_LAUNCH_STATE=live` and no legacy public mint or
   buy-url variables.
5. Deploy Railway with all money-moving flags false.
6. Run one dry cycle and verify creator fees are converted only into $NEURAL.
7. Confirm the $BRAINROT and $NEURAL mints resolve to supported SPL token
   programs and Jupiter quotes simulate from the treasury.
8. Confirm the treasury retains the permanent SOL reserve plus transaction fees
   and associated-token-account rent for recipient wallets.
9. Confirm duplicate epoch protection, retry settings, and emergency pause are
   configured.
10. Enable claim, buy, and airdrop gates only after reviewing the dry-run
    transaction summary and payout rows.
11. Enable the worker last, then verify the first settled cycle appears in the
    public receipt ledger with Solscan links.

No mainnet transaction should be signed or sent as part of repository setup.
