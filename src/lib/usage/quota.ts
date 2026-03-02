import type { PlanTier, QuotaSnapshot } from "@/lib/billing/types";

export function getMonthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

export function getNextMonthStartUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0),
  );
}

export function createQuotaSnapshot(
  planTier: PlanTier,
  chartsUsed: number,
  freeChartQuota: number,
  now = new Date(),
): QuotaSnapshot {
  const resetAt = getNextMonthStartUtc(now).toISOString();

  if (planTier === "pro") {
    return {
      planTier,
      chartsUsed,
      chartsRemaining: null,
      resetAt,
    };
  }

  return {
    planTier,
    chartsUsed,
    chartsRemaining: Math.max(0, freeChartQuota - chartsUsed),
    resetAt,
  };
}

export function canConsumeChartQuota(snapshot: QuotaSnapshot): boolean {
  if (snapshot.planTier === "pro") {
    return true;
  }

  return (snapshot.chartsRemaining ?? 0) > 0;
}
