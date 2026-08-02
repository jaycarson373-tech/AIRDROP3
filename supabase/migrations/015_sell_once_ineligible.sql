begin;

-- Any recorded balance decrease permanently removes the wallet from future
-- eligibility. The worker compares raw balances, so even the smallest token
-- unit leaving the wallet is detected.
update holder_states
set
  eligible_since = null,
  current_streak_epochs = 0,
  current_multiplier_bps = 10000,
  permanently_ineligible = true,
  ineligible_reason = 'balance_decreased',
  ineligible_at = coalesce(ineligible_at, now()),
  updated_at = now()
where ineligible_reason = 'balance_decreased';

commit;
