// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAdHocHistory,
  deleteAdHocHistoryRecord,
  getAdHocHistoryById,
  listAdHocHistory,
  saveAdHocHistoryRecord,
} from "@/lib/charts/ad-hoc-history";

const basePayload = {
  birthInput: {
    fullName: "Test User",
    dateOfBirth: "1990-05-15",
    timeOfBirth: "14:30",
    timezone: "Asia/Kolkata",
    latitude: 19.076,
    longitude: 72.8777,
  },
  calculationResult: {
    metadata: {
      fullName: "Test User",
      dateOfBirth: "1990-05-15",
      timeOfBirth: "14:30",
      timezone: "Asia/Kolkata",
      latitude: 19.076,
      longitude: 72.8777,
      utcDateTime: "1990-05-15T09:00:00.000Z",
      jdUt: 123,
      siderealMode: "Lahiri" as const,
      ayanamsa: 24,
    },
    bodies: [],
  },
};

describe("ad-hoc history", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and lists history records", () => {
    const saved = saveAdHocHistoryRecord({
      ...basePayload,
      origin: "guest",
    });

    const list = listAdHocHistory();

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(saved.id);
    expect(list[0]?.origin).toBe("guest");
  });

  it("gets and deletes specific records", () => {
    const saved = saveAdHocHistoryRecord({
      ...basePayload,
      origin: "logged_in_ad_hoc",
    });

    expect(getAdHocHistoryById(saved.id)?.id).toBe(saved.id);

    deleteAdHocHistoryRecord(saved.id);

    expect(getAdHocHistoryById(saved.id)).toBeNull();
  });

  it("clears history", () => {
    saveAdHocHistoryRecord({
      ...basePayload,
      origin: "guest",
    });

    clearAdHocHistory();
    expect(listAdHocHistory()).toHaveLength(0);
  });
});
