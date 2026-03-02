create table if not exists public.user_profiles_main (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique references public.user_accounts(clerk_user_id) on delete cascade,
  full_name text not null,
  birth_date date not null,
  birth_time time not null,
  birth_timezone text not null,
  birth_latitude numeric(9, 6) not null,
  birth_longitude numeric(9, 6) not null,
  birth_place_label text,
  gender text not null check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_profiles_linked (
  id uuid primary key default gen_random_uuid(),
  main_profile_id uuid not null references public.user_profiles_main(id) on delete cascade,
  relation_type text not null check (relation_type in ('partner', 'child')),
  full_name text not null,
  birth_date date not null,
  birth_time time not null,
  birth_timezone text not null,
  birth_latitude numeric(9, 6) not null,
  birth_longitude numeric(9, 6) not null,
  birth_place_label text,
  gender text not null check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.kundli_records (
  id uuid primary key default gen_random_uuid(),
  owner_profile_type text not null check (owner_profile_type in ('main', 'linked')),
  owner_main_profile_id uuid references public.user_profiles_main(id) on delete cascade,
  owner_linked_profile_id uuid references public.user_profiles_linked(id) on delete cascade,
  input_snapshot jsonb not null,
  calculation_result jsonb not null,
  calculated_at timestamptz not null,
  profile_updated_at_snapshot timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint kundli_owner_main_check check (
    (owner_profile_type = 'main' and owner_main_profile_id is not null and owner_linked_profile_id is null)
    or
    (owner_profile_type = 'linked' and owner_linked_profile_id is not null and owner_main_profile_id is null)
  )
);

create unique index if not exists kundli_records_unique_main_active
on public.kundli_records(owner_main_profile_id)
where owner_profile_type = 'main' and deleted_at is null;

create unique index if not exists kundli_records_unique_linked_active
on public.kundli_records(owner_linked_profile_id)
where owner_profile_type = 'linked' and deleted_at is null;

create or replace function public.validate_max_linked_profiles()
returns trigger
language plpgsql
as $$
declare
  active_count integer;
begin
  if new.deleted_at is not null then
    return new;
  end if;

  select count(*)
  into active_count
  from public.user_profiles_linked upl
  where upl.main_profile_id = new.main_profile_id
    and upl.deleted_at is null
    and (tg_op <> 'UPDATE' or upl.id <> new.id);

  if active_count >= 3 then
    raise exception 'main profile can have at most 3 active linked profiles';
  end if;

  return new;
end;
$$;

create trigger user_profiles_main_set_updated_at
before update on public.user_profiles_main
for each row
execute function public.tg_set_updated_at();

create trigger user_profiles_linked_set_updated_at
before update on public.user_profiles_linked
for each row
execute function public.tg_set_updated_at();

create trigger kundli_records_set_updated_at
before update on public.kundli_records
for each row
execute function public.tg_set_updated_at();

create trigger enforce_max_linked_profiles
before insert or update on public.user_profiles_linked
for each row
execute function public.validate_max_linked_profiles();
