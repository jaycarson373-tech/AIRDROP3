# Scout Launch Kit

## Positioning

**Scout** is the fastest way to see where crypto attention is moving.

**Tagline:** Never miss the runner again.

Scout records authenticated signals, explains the connected market factors behind each ranking, and gives qualified holders the early feed before signals become public.

## Launch copy

### Short post

Scout is live.

See where attention is moving before it becomes obvious.

Hold 1M+ $RUNNER for eligibility in the five-minute holder distribution rail.

### Thread outline

1. Scout turns fast-moving token attention into a transparent, queryable signal record.
2. Each signal is enriched with real connected market data and an explainable Scout Score.
3. Qualified holders receive the immediate feed; public signals follow one minute later.
4. The active authenticated signal can drive the next treasury epoch.
5. Signal selections, buys, and settled holder payouts remain independently verifiable.

## Telegram setup

1. Create the bot with BotFather and set `TELEGRAM_BOT_TOKEN`.
2. Generate a random `TELEGRAM_WEBHOOK_SECRET`.
3. Set `SCOUT_SIGNAL_CHAT_IDS` to the allowlisted source channel IDs.
4. Set `SCOUT_PREMIUM_CHAT_IDS` and `SCOUT_PUBLIC_CHAT_IDS`.
5. Register `/api/scout/telegram` as the Telegram webhook and pass the webhook secret.
6. Keep `SCOUT_TELEGRAM_AUTO_ACTIVATE=false` until source parsing has been verified with a queued test signal.

Supported commands: `/runner`, `/top`, `/new`, `/search`, `/scan`, `/watch`, `/unwatch`, `/performance`, `/help`.

## Important product boundaries

- Telegram ingestion, delayed public delivery, holder access, signal search, API-key validation, and dynamic treasury handoff are implemented.
- Subscription billing is not connected yet.
- Buyback and burn execution is not connected yet; the 60/40 values are configurable treasury targets only.
- Social, X, holder-growth, and smart-wallet adapters display unavailable states until real data sources are connected.
- Scout Score is a ranking signal, not a guarantee of price performance.

## Preflight

- [ ] All exposed RPC, Supabase, Telegram, admin, and treasury credentials rotated
- [ ] Scout migration applied
- [ ] Old launch data reset
- [ ] Source mint and public links verified
- [ ] 1M eligibility displayed by site and worker
- [ ] Five-minute epoch displayed by site and worker
- [ ] First signal queued and reviewed
- [ ] Premium/public one-minute release delay tested
- [ ] Dynamic selection tested with gates off
- [ ] Treasury reserves funded and verified
- [ ] First live epoch monitored through claim, buy, snapshot, payout, and receipt
