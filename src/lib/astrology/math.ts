import { NAKSHATRA_NAMES, RASHI_NAMES } from "@/lib/astrology/constants";

const NAKSHATRA_SIZE = 360 / 27;

export function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function toRashi(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  const index = Math.floor(normalized / 30);

  return RASHI_NAMES[index] ?? RASHI_NAMES[0];
}

export function toNakshatra(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  const index = Math.min(
    Math.floor(normalized / NAKSHATRA_SIZE),
    NAKSHATRA_NAMES.length - 1,
  );

  return NAKSHATRA_NAMES[index] ?? NAKSHATRA_NAMES[0];
}

export function toDms(longitude: number): string {
  const normalized = normalizeLongitude(longitude);
  const degrees = Math.floor(normalized);
  const minutesFloat = (normalized - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return `${degrees} deg ${minutes}' ${seconds.toFixed(2)}\"`;
}
