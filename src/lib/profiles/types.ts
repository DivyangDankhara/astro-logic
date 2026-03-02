import type { CalculateResponse } from "@/lib/astrology/types";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type RelationType = "partner" | "child";

export interface ProfileBirthDetails {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthTimezone: string;
  birthLatitude: number;
  birthLongitude: number;
  birthPlaceLabel: string | null;
  gender: Gender;
}

export interface MainProfileRecord extends ProfileBirthDetails {
  id: string;
  clerkUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LinkedProfileRecord extends ProfileBirthDetails {
  id: string;
  mainProfileId: string;
  relationType: RelationType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type KundliOwnerType = "main" | "linked";

export interface KundliRecord {
  id: string;
  ownerProfileType: KundliOwnerType;
  ownerMainProfileId: string | null;
  ownerLinkedProfileId: string | null;
  inputSnapshot: Record<string, unknown>;
  calculationResult: CalculateResponse;
  calculatedAt: string;
  profileUpdatedAtSnapshot: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface KundliStalenessState {
  isStale: boolean;
  reason: "missing" | "profile_updated" | "force" | "fresh";
}

export interface AdHocLocalHistoryRecord {
  id: string;
  personName: string;
  birthInput: {
    fullName: string;
    dateOfBirth: string;
    timeOfBirth: string;
    timezone: string;
    latitude: number;
    longitude: number;
  };
  calculationResult: CalculateResponse;
  createdAt: string;
  origin: "guest" | "logged_in_ad_hoc";
}
