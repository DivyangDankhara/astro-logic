import type Stripe from "stripe";

import type { PlanTier, SubscriptionStatus } from "@/lib/billing/types";

export function mapStripeStatusToSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete") return "incomplete";
  if (status === "trialing") return "trialing";

  return "unpaid";
}

export function getPlanTierFromSubscriptionStatus(
  status: SubscriptionStatus,
  currentPeriodEnd: string | null = null,
): PlanTier {
  if (status === "active" || status === "trialing") {
    return "pro";
  }

  if (status === "canceled" && currentPeriodEnd) {
    const expiresAt = Date.parse(currentPeriodEnd);
    if (!Number.isNaN(expiresAt) && expiresAt > Date.now()) {
      return "pro";
    }
  }

  return "free";
}
