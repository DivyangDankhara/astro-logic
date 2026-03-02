import { z } from "zod";

import type { CalculateRequest } from "@/lib/validation/calculate";
import type { CalculateResponse } from "@/lib/astrology/types";
import type { AdHocLocalHistoryRecord } from "@/lib/profiles/types";

const STORAGE_KEY = "astrologic.adHocHistory.v1";
const MAX_RECORDS = 50;

const birthInputSchema = z.object({
  fullName: z.string(),
  dateOfBirth: z.string(),
  timeOfBirth: z.string(),
  timezone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

const adHocRecordSchema = z.object({
  id: z.string(),
  personName: z.string(),
  birthInput: birthInputSchema,
  calculationResult: z.any(),
  createdAt: z.string(),
  origin: z.enum(["guest", "logged_in_ad_hoc"]),
});

const adHocHistorySchema = z.array(adHocRecordSchema);

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function parseHistory(raw: string | null): AdHocLocalHistoryRecord[] {
  if (!raw) {
    return [];
  }

  const parsed = adHocHistorySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return [];
  }

  return parsed.data as AdHocLocalHistoryRecord[];
}

export function listAdHocHistory(): AdHocLocalHistoryRecord[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  return parseHistory(storage.getItem(STORAGE_KEY)).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function getAdHocHistoryById(id: string): AdHocLocalHistoryRecord | null {
  return listAdHocHistory().find((item) => item.id === id) ?? null;
}

export function clearAdHocHistory(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
}

export function deleteAdHocHistoryRecord(id: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const next = listAdHocHistory().filter((item) => item.id !== id);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function saveAdHocHistoryRecord(params: {
  birthInput: CalculateRequest;
  calculationResult: CalculateResponse;
  origin: "guest" | "logged_in_ad_hoc";
}): AdHocLocalHistoryRecord {
  const storage = getStorage();

  const record: AdHocLocalHistoryRecord = {
    id: crypto.randomUUID(),
    personName: params.birthInput.fullName,
    birthInput: {
      fullName: params.birthInput.fullName,
      dateOfBirth: params.birthInput.dateOfBirth,
      timeOfBirth: params.birthInput.timeOfBirth,
      timezone: params.birthInput.timezone,
      latitude: params.birthInput.latitude,
      longitude: params.birthInput.longitude,
    },
    calculationResult: params.calculationResult,
    createdAt: new Date().toISOString(),
    origin: params.origin,
  };

  if (!storage) {
    return record;
  }

  const next = [record, ...listAdHocHistory()].slice(0, MAX_RECORDS);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));

  return record;
}
