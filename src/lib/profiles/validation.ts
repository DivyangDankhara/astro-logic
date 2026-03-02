import { z } from "zod";

import {
  isValid24HourTime,
  isValidIanaTimeZone,
  isValidIsoDate,
} from "@/lib/astrology/time";

export const genderSchema = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

export const relationTypeSchema = z.enum(["partner", "child"]);

export const baseProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer."),
  birthDate: z.string().refine(isValidIsoDate, {
    message: "Birth date must be a valid date in YYYY-MM-DD format.",
  }),
  birthTime: z.string().refine(isValid24HourTime, {
    message: "Birth time must be in 24-hour HH:mm format.",
  }),
  birthTimezone: z.string().refine(isValidIanaTimeZone, {
    message: "Timezone must be a valid IANA timezone.",
  }),
  birthLatitude: z
    .number({
      error: "Latitude must be a number.",
    })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  birthLongitude: z
    .number({
      error: "Longitude must be a number.",
    })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
  birthPlaceLabel: z.string().max(200).optional().nullable(),
  gender: genderSchema,
});

export const mainProfileUpsertSchema = baseProfileSchema;

export const linkedProfileCreateSchema = baseProfileSchema.extend({
  relationType: relationTypeSchema,
});

export const linkedProfileUpdateSchema = linkedProfileCreateSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export type MainProfileUpsertInput = z.infer<typeof mainProfileUpsertSchema>;
export type LinkedProfileCreateInput = z.infer<typeof linkedProfileCreateSchema>;
export type LinkedProfileUpdateInput = z.infer<typeof linkedProfileUpdateSchema>;
