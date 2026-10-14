# BRAINROT launch checklist

1. Launch `$BRAINROT` through Pump.fun and copy the canonical token page URL.
2. Set `NEXT_PUBLIC_PUMPFUN_URL` to that exact token page URL. Do not leave the
   site’s buy button pointing to the generic Pump.fun homepage after launch.
3. Set `BRAINROT_LAUNCH_STATE=live` and deploy the website.
4. Find the exact `$BRAINROT` Solana pair on DexScreener, confirm its mint, then
   set `NEXT_PUBLIC_DEXSCREENER_PAIR` to that pair address. The chart stays in
   standby while this value is blank.
5. Verify the production site’s launch link, chart, mobile layout, metadata,
   Oxford source link, and Google Trends embed. Check the empty chart state if
   the pair has not indexed yet.
6. Keep the legacy Railway distribution worker and its claim, buy, and airdrop
   flags disabled. Pump.fun does not administer a separate holder-reward
   program; publish separate rules only after their funding and settlement
   flow are independently verified.

No mainnet transaction should be signed or sent as part of repository setup.
