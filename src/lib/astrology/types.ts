import type { BODY_DEFINITIONS } from "@/lib/astrology/constants";

export type BodyKey = (typeof BODY_DEFINITIONS)[number]["key"];

export interface CalculatedBody {
  key: BodyKey;
  name: string;
  longitude: number;
  longitudeDms: string;
  retrograde: boolean;
  rashi: string;
  nakshatra: string;
}

export interface CalculationMetadata {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string;
  timezone: string;
  latitude: number;
  longitude: number;
  utcDateTime: string;
  jdUt: number;
  siderealMode: "Lahiri";
  ayanamsa: number;
}

export interface CalculateResponse {
  metadata: CalculationMetadata;
  bodies: CalculatedBody[];
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}
