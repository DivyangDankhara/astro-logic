create extension if not exists pgcrypto;

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_accounts (
  clerk_user_id text primary key,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.user_accounts(clerk_user_id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  status text not null default 'none' check (status in ('none', 'active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id)
);

create table if not exists public.usage_monthly (
  clerk_user_id text not null references public.user_accounts(clerk_user_id) on delete cascade,
  month_start_utc timestamptz not null,
  chart_count integer not null default 0 check (chart_count >= 0),
  interpretation_count integer not null default 0 check (interpretation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, month_start_utc)
);

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.user_accounts(clerk_user_id) on delete cascade,
  birth_input jsonb not null,
  calculation_result jsonb not null,
  comparison_traits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.chart_interpretations (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null references public.charts(id) on delete cascade,
  clerk_user_id text not null references public.user_accounts(clerk_user_id) on delete cascade,
  model text not null,
  interpretation jsonb not null,
  prompt_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists chart_interpretations_unique_chart_model_active
on public.chart_interpretations(chart_id, model)
where deleted_at is null;

create table if not exists public.billing_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload_hash text not null
);

create index if not exists charts_clerk_user_id_created_at_idx
on public.charts(clerk_user_id, created_at desc)
where deleted_at is null;

create trigger user_accounts_set_updated_at
before update on public.user_accounts
for each row
execute function public.tg_set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.tg_set_updated_at();

create trigger charts_set_updated_at
before update on public.charts
for each row
execute function public.tg_set_updated_at();

create trigger chart_interpretations_set_updated_at
before update on public.chart_interpretations
for each row
execute function public.tg_set_updated_at();

create or replace function public.consume_chart_quota(
  p_clerk_user_id text,
  p_month_start_utc timestamptz,
  p_free_quota integer
)
returns table(chart_count integer, charts_remaining integer, allowed boolean)
language plpgsql
as $$
declare
  updated_count integer;
  existing_count integer;
begin
  insert into public.usage_monthly (clerk_user_id, month_start_utc, chart_count, interpretation_count, updated_at)
  values (p_clerk_user_id, p_month_start_utc, 0, 0, now())
  on conflict (clerk_user_id, month_start_utc) do nothing;

  update public.usage_monthly
  set chart_count = chart_count + 1,
      updated_at = now()
  where clerk_user_id = p_clerk_user_id
    and month_start_utc = p_month_start_utc
    and chart_count < p_free_quota
  returning chart_count into updated_count;

  if updated_count is null then
    select um.chart_count
    into existing_count
    from public.usage_monthly um
    where um.clerk_user_id = p_clerk_user_id
      and um.month_start_utc = p_month_start_utc;

    return query
    select coalesce(existing_count, 0), greatest(0, p_free_quota - coalesce(existing_count, 0)), false;
    return;
  end if;

  return query
  select updated_count, greatest(0, p_free_quota - updated_count), true;
end;
$$;
