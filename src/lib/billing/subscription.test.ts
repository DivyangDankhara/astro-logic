import { describe, expect, it } from "vitest";

import {
  getPlanTierFromSubscriptionStatus,
  mapStripeStatusToSubscriptionStatus,
} from "@/lib/billing/subscription";

describe("subscription mapping", () => {
  it("maps Stripe statuses", () => {
    expect(mapStripeStatusToSubscriptionStatus("active")).toBe("active");
    expect(mapStripeStatusToSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapStripeStatusToSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeStatusToSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeStatusToSubscriptionStatus("incomplete")).toBe("incomplete");
    expect(mapStripeStatusToSubscriptionStatus("unpaid")).toBe("unpaid");
  });

  it("keeps pro tier active until period end on canceled status", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();

    expect(getPlanTierFromSubscriptionStatus("canceled", future)).toBe("pro");
    expect(getPlanTierFromSubscriptionStatus("canceled", past)).toBe("free");
    expect(getPlanTierFromSubscriptionStatus("active")).toBe("pro");
    expect(getPlanTierFromSubscriptionStatus("none")).toBe("free");
  });
});
