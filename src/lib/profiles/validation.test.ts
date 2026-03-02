import { describe, expect, it } from "vitest";

import {
  linkedProfileCreateSchema,
  mainProfileUpsertSchema,
} from "@/lib/profiles/validation";

describe("profile validation", () => {
  it("accepts valid main profile payload", () => {
    const parsed = mainProfileUpsertSchema.parse({
      fullName: "Aarav Sharma",
      birthDate: "1990-05-15",
      birthTime: "14:30",
      birthTimezone: "Asia/Kolkata",
      birthLatitude: 19.076,
      birthLongitude: 72.8777,
      birthPlaceLabel: "Mumbai",
      gender: "male",
    });

    expect(parsed.fullName).toBe("Aarav Sharma");
  });

  it("restricts relation type to partner or child", () => {
    expect(() =>
      linkedProfileCreateSchema.parse({
        relationType: "friend",
        fullName: "Other Person",
        birthDate: "1990-05-15",
        birthTime: "14:30",
        birthTimezone: "Asia/Kolkata",
        birthLatitude: 19.076,
        birthLongitude: 72.8777,
        gender: "female",
      }),
    ).toThrow();
  });
});
