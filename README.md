# SNDK6900

SNDK6900 is a red-and-black Solana holder distribution interface. Eligible
holders receive the configured SNDK reward token on five-minute UTC cycles.
There is no wallet connection or manual claim flow on the public site.

The public interface also tracks the live market-cap gap between Sandisk
Corporation (`NASDAQ: SNDK`) and SNDK6900. The comparison renders only when
both data sources return real values.

## Distribution policy

- Holder snapshots align to five-minute UTC boundaries.
- The configured source token determines eligibility.
- The configured reward mint must be SNDK before distributions are enabled.
- Public totals come from completed backend records; missing values stay empty.
- `SNDK6900_TOKEN_MINT` enables the DexScreener side of the Flip Index.

## Local checks

```bash
npm ci
npm run check
```

## Deployment

- Vercel hosts the Next.js interface.
- Railway runs the distribution worker.
- Supabase stores snapshots, distribution records, and receipts.
- Keep all payout flags disabled until the source mint, SNDK reward mint,
  treasury wallet, exclusions, and one proof-verified dry run are confirmed.

The old Casino checkpoint is preserved in the `casino-2-checkpoint` tag and
`archive/casino-2-checkpoint` branch.
