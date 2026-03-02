export type PlanTier = "free" | "pro";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "trialing"
  | "unpaid";

export interface SubscriptionRecord {
  id: string;
  clerkUserId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planTier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotaSnapshot {
  planTier: PlanTier;
  chartsUsed: number;
  chartsRemaining: number | null;
  resetAt: string;
}

export interface BillingStatus {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  quotaSnapshot: QuotaSnapshot;
}
