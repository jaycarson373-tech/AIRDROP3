alter table public.casino_rounds
  add column if not exists randomness_program text,
  add column if not exists randomness_queue text,
  add column if not exists randomness_authority text,
  add column if not exists randomness_reveal_slot bigint,
  add column if not exists randomness_binding text;

alter table public.casino_rounds
  drop constraint if exists casino_rounds_verified_randomness_check;

alter table public.casino_rounds
  add constraint casino_rounds_verified_randomness_check
    check (
      randomness_verified_at is null
      or (
        randomness_provider = 'switchboard'
        and randomness_program is not null
        and randomness_queue is not null
        and randomness_authority is not null
        and randomness_account is not null
        and randomness_commit_slot is not null
        and randomness_reveal_slot is not null
        and randomness_reveal_slot > randomness_commit_slot
        and randomness_binding is not null
        and randomness_hex is not null
        and randomness_commit_tx_sig is not null
        and randomness_reveal_tx_sig is not null
      )
    );

create or replace function public.guard_casino_round_commitment()
returns trigger
language plpgsql
as $$
begin
  if old.snapshot_hash is distinct from new.snapshot_hash then
    raise exception 'casino snapshot commitment is immutable';
  end if;

  if old.randomness_commit_tx_sig is not null and (
    old.randomness_provider is distinct from new.randomness_provider
    or old.randomness_program is distinct from new.randomness_program
    or old.randomness_queue is distinct from new.randomness_queue
    or old.randomness_authority is distinct from new.randomness_authority
    or old.randomness_account is distinct from new.randomness_account
    or old.randomness_commit_slot is distinct from new.randomness_commit_slot
    or old.randomness_binding is distinct from new.randomness_binding
    or old.randomness_commit_tx_sig is distinct from new.randomness_commit_tx_sig
  ) then
    raise exception 'casino randomness commitment is immutable';
  end if;

  if old.randomness_verified_at is not null and (
    old.randomness_reveal_slot is distinct from new.randomness_reveal_slot
    or old.randomness_hex is distinct from new.randomness_hex
    or old.randomness_reveal_tx_sig is distinct from new.randomness_reveal_tx_sig
    or old.randomness_verified_at is distinct from new.randomness_verified_at
  ) then
    raise exception 'verified casino randomness is immutable';
  end if;

  if old.status = 'settled' and old is distinct from new then
    raise exception 'settled casino rounds are immutable';
  end if;

  return new;
end;
$$;

create or replace view public.casino_public_rounds as
select
  round_id,
  round_sequence,
  game,
  status,
  eligible_count,
  started_at,
  playback_started_at,
  playback_ends_at,
  results_hash,
  randomness_provider,
  randomness_account,
  randomness_commit_tx_sig,
  randomness_reveal_tx_sig,
  randomness_verified_at,
  settlement_tx_sig,
  settled_at,
  randomness_program,
  randomness_queue,
  randomness_authority,
  randomness_commit_slot,
  randomness_reveal_slot,
  randomness_binding,
  randomness_hex
from public.casino_rounds;

revoke all on public.casino_public_rounds from public;
grant select on public.casino_public_rounds to anon, authenticated, service_role;
