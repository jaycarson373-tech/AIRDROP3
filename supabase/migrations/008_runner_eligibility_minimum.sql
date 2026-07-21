insert into public.scout_settings (key, value, description)
values (
  'eligibility_minimum',
  '1000000'::jsonb,
  'Minimum RUNNER balance for holder distributions.'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now();
