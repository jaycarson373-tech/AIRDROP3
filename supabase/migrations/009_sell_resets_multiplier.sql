begin;

alter table holder_states
  alter column permanently_ineligible set default false;

update holder_states
set
  eligible_since = null,
  current_streak_epochs = 0,
  current_multiplier_bps = 10000,
  permanently_ineligible = false,
  ineligible_reason = case
    when source_balance > 0 then null
    else 'dropped_below_threshold'
  end,
  ineligible_at = null,
  updated_at = now()
where permanently_ineligible = true
   or ineligible_reason = 'balance_decreased';

commit;
