comment on table public.charts is
  'Deprecated: legacy chart snapshots. New canonical model uses user_profiles_main/user_profiles_linked + kundli_records.';

comment on column public.charts.birth_input is
  'Deprecated legacy payload. Ad-hoc calculations now persist in browser local storage only.';
