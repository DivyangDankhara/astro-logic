import { describe, expect, it } from "vitest";

import {
  canConsumeChartQuota,
  createQuotaSnapshot,
  getMonthStartUtc,
  getNextMonthStartUtc,
} from "@/lib/usage/quota";

describe("quota utils", () => {
  it("computes UTC month boundaries", () => {
    const date = new Date("2026-03-15T12:00:00.000Z");

    expect(getMonthStartUtc(date).toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(getNextMonthStartUtc(date).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("creates free tier snapshot with remaining quota", () => {
    const snapshot = createQuotaSnapshot("free", 2, 3, new Date("2026-03-20T00:00:00.000Z"));

    expect(snapshot.planTier).toBe("free");
    expect(snapshot.chartsRemaining).toBe(1);
    expect(canConsumeChartQuota(snapshot)).toBe(true);
  });

  it("creates pro tier snapshot with unlimited remaining", () => {
    const snapshot = createQuotaSnapshot("pro", 999, 3, new Date("2026-03-20T00:00:00.000Z"));

    expect(snapshot.chartsRemaining).toBeNull();
    expect(canConsumeChartQuota(snapshot)).toBe(true);
  });
});
