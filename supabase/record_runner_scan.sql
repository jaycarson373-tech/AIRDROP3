-- Replace the six values in the params row, then run this entire transaction.
-- Market cap is the snapshot at scan time; current market cap is read live by the site.

begin;

create temporary table runner_scan_input (
  mint text not null,
  name text not null,
  symbol text not null,
  market_cap_usd numeric not null,
  detected_at timestamptz not null,
  selection_reason text
) on commit drop;

insert into runner_scan_input values (
  'SOLANA_MINT_ADDRESS',
  'Token Name',
  'SYMBOL',
  125000,
  '2026-07-21 14:04:00-04',
  'Manual verified Runner scan'
);

update public.scout_signals
set status = 'passed',
    retired_at = runner_scan_input.detected_at,
    updated_at = now()
from runner_scan_input
where scout_signals.status = 'active'
  and scout_signals.mint <> runner_scan_input.mint;

insert into public.scout_signals (
  chain, mint, name, symbol, source, source_url, status,
  market_cap_usd, selection_reason, detected_at, selected_at,
  public_at, retired_at, updated_at
)
select
  'solana',
  runner_scan_input.mint,
  runner_scan_input.name,
  upper(runner_scan_input.symbol),
  'manual',
  'https://dexscreener.com/solana/' || runner_scan_input.mint,
  'active',
  runner_scan_input.market_cap_usd,
  runner_scan_input.selection_reason,
  runner_scan_input.detected_at,
  runner_scan_input.detected_at,
  runner_scan_input.detected_at,
  null,
  now()
from runner_scan_input
on conflict (mint) do update set
  name = excluded.name,
  symbol = excluded.symbol,
  source = excluded.source,
  source_url = excluded.source_url,
  status = 'active',
  market_cap_usd = excluded.market_cap_usd,
  selection_reason = excluded.selection_reason,
  detected_at = excluded.detected_at,
  selected_at = excluded.selected_at,
  public_at = excluded.public_at,
  retired_at = null,
  updated_at = now();

insert into public.scout_signal_events (signal_id, event_type, payload)
select
  scout_signals.id,
  'target_locked',
  jsonb_build_object(
    'market_cap_at_scan_usd', runner_scan_input.market_cap_usd,
    'source', 'manual'
  )
from public.scout_signals
join runner_scan_input on runner_scan_input.mint = scout_signals.mint;

commit;
