import { describe, expect, it } from "vitest";

import { computeKundliStaleness } from "@/lib/kundli/service";

describe("kundli staleness", () => {
  it("marks missing record as stale", () => {
    const result = computeKundliStaleness({
      existing: null,
      profileUpdatedAt: "2026-01-01T00:00:00.000Z",
      force: false,
    });

    expect(result).toEqual({
      isStale: true,
      reason: "missing",
    });
  });

  it("marks stale when profile updated after snapshot", () => {
    const result = computeKundliStaleness({
      existing: {
        id: "1",
        ownerProfileType: "main",
        ownerMainProfileId: "m1",
        ownerLinkedProfileId: null,
        inputSnapshot: {},
        calculationResult: {
          metadata: {
            fullName: "A",
            dateOfBirth: "1990-01-01",
            timeOfBirth: "10:00",
            timezone: "Asia/Kolkata",
            latitude: 1,
            longitude: 1,
            utcDateTime: "1990-01-01T00:00:00.000Z",
            jdUt: 1,
            siderealMode: "Lahiri",
            ayanamsa: 1,
          },
          bodies: [],
        },
        calculatedAt: "2026-01-01T00:00:00.000Z",
        profileUpdatedAtSnapshot: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        deletedAt: null,
      },
      profileUpdatedAt: "2026-01-02T00:00:00.000Z",
      force: false,
    });

    expect(result).toEqual({
      isStale: true,
      reason: "profile_updated",
    });
  });

  it("honors force recalculation", () => {
    const result = computeKundliStaleness({
      existing: null,
      profileUpdatedAt: "2026-01-01T00:00:00.000Z",
      force: true,
    });

    expect(result).toEqual({
      isStale: true,
      reason: "force",
    });
  });
});
