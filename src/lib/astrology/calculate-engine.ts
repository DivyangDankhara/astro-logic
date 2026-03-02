import {
  CalculationFlag,
  LunarPoint,
  Planet,
  SiderealMode,
  calculatePosition,
  dateToJulianDay,
  getAyanamsa,
  setSiderealMode,
} from "@swisseph/node";

import { localDateTimeToUtcDate } from "@/lib/astrology/time";
import { normalizeLongitude, toDms, toNakshatra, toRashi } from "@/lib/astrology/math";
import type { CalculateResponse } from "@/lib/astrology/types";
import type { CalculateRequest } from "@/lib/validation/calculate";

const CALCULATION_FLAGS =
  CalculationFlag.SwissEphemeris |
  CalculationFlag.Sidereal |
  CalculationFlag.Speed;

const CORE_BODIES = [
  { key: "sun", name: "Sun", body: Planet.Sun },
  { key: "moon", name: "Moon", body: Planet.Moon },
  { key: "mercury", name: "Mercury", body: Planet.Mercury },
  { key: "venus", name: "Venus", body: Planet.Venus },
  { key: "mars", name: "Mars", body: Planet.Mars },
  { key: "jupiter", name: "Jupiter", body: Planet.Jupiter },
  { key: "saturn", name: "Saturn", body: Planet.Saturn },
  { key: "rahu", name: "Rahu (True Node)", body: LunarPoint.TrueNode },
] as const;

export function calculateChartData(payload: CalculateRequest): CalculateResponse {
  const utcDate = localDateTimeToUtcDate(
    payload.dateOfBirth,
    payload.timeOfBirth,
    payload.timezone,
  );

  const jdUt = dateToJulianDay(utcDate);

  setSiderealMode(SiderealMode.Lahiri);

  const computedBodies = CORE_BODIES.map((entry) => {
    const position = calculatePosition(jdUt, entry.body, CALCULATION_FLAGS);
    const normalizedLongitude = normalizeLongitude(position.longitude);

    return {
      key: entry.key,
      name: entry.name,
      longitude: Number(normalizedLongitude.toFixed(6)),
      longitudeDms: toDms(normalizedLongitude),
      retrograde: position.longitudeSpeed < 0,
      rashi: toRashi(normalizedLongitude),
      nakshatra: toNakshatra(normalizedLongitude),
    };
  });

  const rahu = computedBodies.find((body) => body.key === "rahu");

  if (!rahu) {
    throw new Error("Rahu calculation failed.");
  }

  const ketuLongitude = normalizeLongitude(rahu.longitude + 180);

  const ketu = {
    key: "ketu" as const,
    name: "Ketu",
    longitude: Number(ketuLongitude.toFixed(6)),
    longitudeDms: toDms(ketuLongitude),
    retrograde: rahu.retrograde,
    rashi: toRashi(ketuLongitude),
    nakshatra: toNakshatra(ketuLongitude),
  };

  return {
    metadata: {
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth,
      timeOfBirth: payload.timeOfBirth,
      timezone: payload.timezone,
      latitude: payload.latitude,
      longitude: payload.longitude,
      utcDateTime: utcDate.toISOString(),
      jdUt: Number(jdUt.toFixed(8)),
      siderealMode: "Lahiri",
      ayanamsa: Number(getAyanamsa(jdUt).toFixed(8)),
    },
    bodies: [...computedBodies, ketu],
  };
}
