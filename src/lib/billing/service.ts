import type Stripe from "stripe";

import { ensureUserAccount } from "@/lib/accounts/service";
import { createSupabaseServerClient } from "@/lib/clients/supabase";
import { getFreeChartQuota } from "@/lib/config/env";
import { throwIfSupabaseError } from "@/lib/db/errors";
import { mapStripeStatusToSubscriptionStatus } from "@/lib/billing/subscription";
import type {
  BillingStatus,
  PlanTier,
  QuotaSnapshot,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@/lib/billing/types";
import {
  createQuotaSnapshot,
  getMonthStartUtc,
  getNextMonthStartUtc,
} from "@/lib/usage/quota";

interface ConsumeQuotaResult {
  chartCount: number;
  chartsRemaining: number;
  allowed: boolean;
}

function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    planTier: row.plan_tier as PlanTier,
    status: row.status as SubscriptionStatus,
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    createdAt: (row.created_at as string | undefined) ?? undefined,
    updatedAt: (row.updated_at as string | undefined) ?? undefined,
  };
}

function makeDefaultSubscription(clerkUserId: string): SubscriptionRecord {
  return {
    id: "",
    clerkUserId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    planTier: "free",
    status: "none",
    currentPeriodEnd: null,
  };
}

function isFutureIsoDate(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return false;
  }

  return time > Date.now();
}

export function derivePlanTier(
  status: SubscriptionStatus,
  currentPeriodEnd: string | null,
): PlanTier {
  if (status === "active" || status === "trialing") {
    return "pro";
  }

  if (status === "canceled" && isFutureIsoDate(currentPeriodEnd)) {
    return "pro";
  }

  return "free";
}

export async function getSubscriptionForUser(clerkUserId: string): Promise<SubscriptionRecord> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, clerk_user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end, created_at, updated_at",
    )
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  throwIfSupabaseError(error, "subscription_fetch_failed", "Failed to fetch subscription");

  if (!data) {
    return makeDefaultSubscription(clerkUserId);
  }

  return mapSubscriptionRow(data as Record<string, unknown>);
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, clerk_user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end, created_at, updated_at",
    )
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  throwIfSupabaseError(
    error,
    "subscription_fetch_failed",
    "Failed to fetch subscription by Stripe customer",
  );

  if (!data) {
    return null;
  }

  return mapSubscriptionRow(data as Record<string, unknown>);
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, clerk_user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end, created_at, updated_at",
    )
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  throwIfSupabaseError(
    error,
    "subscription_fetch_failed",
    "Failed to fetch subscription by Stripe subscription",
  );

  if (!data) {
    return null;
  }

  return mapSubscriptionRow(data as Record<string, unknown>);
}

export async function upsertSubscription(params: {
  clerkUserId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
}): Promise<SubscriptionRecord> {
  const supabase = createSupabaseServerClient();

  const currentPeriodEnd = params.currentPeriodEnd ?? null;
  const planTier = derivePlanTier(params.status, currentPeriodEnd);

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        clerk_user_id: params.clerkUserId,
        stripe_customer_id: params.stripeCustomerId ?? null,
        stripe_subscription_id: params.stripeSubscriptionId ?? null,
        plan_tier: planTier,
        status: params.status,
        current_period_end: currentPeriodEnd,
      },
      {
        onConflict: "clerk_user_id",
      },
    )
    .select(
      "id, clerk_user_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_end, created_at, updated_at",
    )
    .single();

  throwIfSupabaseError(error, "subscription_upsert_failed", "Failed to upsert subscription");

  return mapSubscriptionRow(data as Record<string, unknown>);
}

export async function setStripeCustomerIdForUser(
  clerkUserId: string,
  stripeCustomerId: string,
): Promise<SubscriptionRecord> {
  const existing = await getSubscriptionForUser(clerkUserId);

  return upsertSubscription({
    clerkUserId,
    stripeCustomerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
    status: existing.status,
    currentPeriodEnd: existing.currentPeriodEnd,
  });
}

export async function getMonthlyUsageCount(
  clerkUserId: string,
  now = new Date(),
): Promise<number> {
  const supabase = createSupabaseServerClient();
  const monthStart = getMonthStartUtc(now).toISOString();

  const { data, error } = await supabase
    .from("usage_monthly")
    .select("chart_count")
    .eq("clerk_user_id", clerkUserId)
    .eq("month_start_utc", monthStart)
    .maybeSingle();

  throwIfSupabaseError(error, "usage_fetch_failed", "Failed to fetch monthly usage");

  if (!data) {
    return 0;
  }

  return Number((data as Record<string, unknown>).chart_count ?? 0);
}

export async function getQuotaSnapshotForUser(
  clerkUserId: string,
  planTier: PlanTier,
  now = new Date(),
): Promise<QuotaSnapshot> {
  const used = await getMonthlyUsageCount(clerkUserId, now);
  return createQuotaSnapshot(planTier, used, getFreeChartQuota(), now);
}

export async function consumeFreeChartQuota(
  clerkUserId: string,
  now = new Date(),
): Promise<ConsumeQuotaResult> {
  const supabase = createSupabaseServerClient();
  const freeQuota = getFreeChartQuota();
  const monthStart = getMonthStartUtc(now).toISOString();

  const { data, error } = await supabase.rpc("consume_chart_quota", {
    p_clerk_user_id: clerkUserId,
    p_month_start_utc: monthStart,
    p_free_quota: freeQuota,
  });

  throwIfSupabaseError(error, "quota_consume_failed", "Failed to consume chart quota");

  const row = (Array.isArray(data) ? data[0] : null) as
    | Record<string, unknown>
    | null;

  return {
    chartCount: Number(row?.chart_count ?? 0),
    chartsRemaining: Number(row?.charts_remaining ?? 0),
    allowed: Boolean(row?.allowed),
  };
}

export async function incrementInterpretationUsage(
  clerkUserId: string,
  now = new Date(),
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const monthStart = getMonthStartUtc(now).toISOString();

  const { error } = await supabase
    .from("usage_monthly")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        month_start_utc: monthStart,
        chart_count: 0,
        interpretation_count: 0,
      },
      {
        onConflict: "clerk_user_id,month_start_utc",
      },
    );

  throwIfSupabaseError(
    error,
    "usage_seed_failed",
    "Failed to initialize interpretation usage row",
  );

  const { error: updateError } = await supabase
    .from("usage_monthly")
    .update({
      interpretation_count: (await getInterpretationUsageCount(clerkUserId, now)) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId)
    .eq("month_start_utc", monthStart);

  throwIfSupabaseError(
    updateError,
    "usage_update_failed",
    "Failed to increment interpretation usage",
  );
}

async function getInterpretationUsageCount(
  clerkUserId: string,
  now = new Date(),
): Promise<number> {
  const supabase = createSupabaseServerClient();
  const monthStart = getMonthStartUtc(now).toISOString();

  const { data, error } = await supabase
    .from("usage_monthly")
    .select("interpretation_count")
    .eq("clerk_user_id", clerkUserId)
    .eq("month_start_utc", monthStart)
    .maybeSingle();

  throwIfSupabaseError(
    error,
    "usage_fetch_failed",
    "Failed to fetch interpretation usage count",
  );

  return Number((data as Record<string, unknown> | null)?.interpretation_count ?? 0);
}

export async function getBillingStatus(clerkUserId: string): Promise<BillingStatus> {
  await ensureUserAccount({ clerkUserId });

  const subscription = await getSubscriptionForUser(clerkUserId);
  const planTier = derivePlanTier(subscription.status, subscription.currentPeriodEnd);
  const quotaSnapshot = await getQuotaSnapshotForUser(clerkUserId, planTier);

  return {
    planTier,
    subscriptionStatus: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    quotaSnapshot,
  };
}

export async function upsertFromStripeSubscription(
  subscription: Stripe.Subscription,
  clerkUserId: string,
): Promise<SubscriptionRecord> {
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const periodEndCandidates = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value) => Number.isFinite(value));

  const periodEndSeconds =
    periodEndCandidates.length > 0
      ? Math.max(...periodEndCandidates)
      : subscription.cancel_at;

  return upsertSubscription({
    clerkUserId,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodEnd: periodEndSeconds
      ? new Date(periodEndSeconds * 1000).toISOString()
      : null,
  });
}

export async function markWebhookEventProcessed(params: {
  stripeEventId: string;
  eventType: string;
  payloadHash: string;
}): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("billing_webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", params.stripeEventId)
    .maybeSingle();

  throwIfSupabaseError(
    existingError,
    "billing_webhook_lookup_failed",
    "Failed to check webhook idempotency",
  );

  if (existing) {
    return false;
  }

  const { error } = await supabase.from("billing_webhook_events").insert({
    stripe_event_id: params.stripeEventId,
    event_type: params.eventType,
    payload_hash: params.payloadHash,
  });

  throwIfSupabaseError(
    error,
    "billing_webhook_insert_failed",
    "Failed to persist webhook event",
  );

  return true;
}

export function getResetDateIso(now = new Date()): string {
  return getNextMonthStartUtc(now).toISOString();
}
