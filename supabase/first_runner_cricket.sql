-- First verified Runner: Cricket The Dog
-- Historical scanner snapshot supplied by Runner: July 21, 2026 at 2:32 PM ET, $28.02K market cap.
-- No confidence, liquidity, volume, or score is inserted because none was supplied for the scan.

begin;

update public.scout_signals
set status = 'passed',
    retired_at = '2026-07-21 14:32:00-04'::timestamptz,
    updated_at = now()
where status = 'active'
  and mint <> 'J33WbCWN2m1EpoNUP9Ch6cWoV5j6BFJervDfgPk3pump';

insert into public.scout_signals (
  chain, mint, name, symbol, source, source_url, status,
  scout_score, price_usd, market_cap_usd, liquidity_usd,
  volume_24h_usd, holder_count, token_age_seconds, metrics,
  reasons, risk_flags, selection_reason, detected_at, selected_at,
  public_at, retired_at, updated_at
)
values (
  'solana',
  'J33WbCWN2m1EpoNUP9Ch6cWoV5j6BFJervDfgPk3pump',
  'Cricket The Dog',
  'Cricket',
  'manual',
  'https://dexscreener.com/solana/9ysevy9uagzud6un1p79l8lxnvb5nzm6ej38eimyhhby',
  'active',
  null,
  null,
  28020,
  null,
  null,
  null,
  null,
  jsonb_build_object(
    'imageUrl', '/tokens/cricket-the-dog.jpg',
    'marketCapAtScanUsd', 28020
  ),
  array[]::text[],
  array[]::text[],
  'Scanner-selected Pump.fun graduate under $100K',
  '2026-07-21 14:32:00-04'::timestamptz,
  '2026-07-21 14:32:00-04'::timestamptz,
  '2026-07-21 14:32:00-04'::timestamptz,
  null,
  now()
)
on conflict (mint) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  source = excluded.source,
  source_url = excluded.source_url,
  status = 'active',
  scout_score = null,
  price_usd = null,
  market_cap_usd = excluded.market_cap_usd,
  liquidity_usd = null,
  volume_24h_usd = null,
  holder_count = null,
  token_age_seconds = null,
  metrics = excluded.metrics,
  reasons = excluded.reasons,
  risk_flags = excluded.risk_flags,
  selection_reason = excluded.selection_reason,
  detected_at = excluded.detected_at,
  selected_at = excluded.selected_at,
  public_at = excluded.public_at,
  retired_at = null,
  updated_at = now();

insert into public.scout_signal_events (signal_id, event_type, payload)
select
  id,
  'target_locked',
  jsonb_build_object(
    'market_cap_at_scan_usd', 28020,
    'source', 'manual',
    'detected_at', '2026-07-21T18:32:00.000Z'
  )
from public.scout_signals
where mint = 'J33WbCWN2m1EpoNUP9Ch6cWoV5j6BFJervDfgPk3pump'
  and not exists (
    select 1
    from public.scout_signal_events existing
    where existing.signal_id = scout_signals.id
      and existing.event_type = 'target_locked'
      and existing.payload->>'detected_at' = '2026-07-21T18:32:00.000Z'
  );

commit;
