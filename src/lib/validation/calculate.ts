import { z } from "zod";

import {
  isValid24HourTime,
  isValidIanaTimeZone,
  isValidIsoDate,
} from "@/lib/astrology/time";

export const calculateRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer."),
  dateOfBirth: z.string().refine(isValidIsoDate, {
    message: "Date of birth must be a valid date in YYYY-MM-DD format.",
  }),
  timeOfBirth: z.string().refine(isValid24HourTime, {
    message: "Time of birth must be in 24-hour HH:mm format.",
  }),
  timezone: z.string().refine(isValidIanaTimeZone, {
    message: "Timezone must be a valid IANA timezone (for example, Asia/Kolkata).",
  }),
  latitude: z
    .number({
      error: "Latitude must be a number.",
    })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  longitude: z
    .number({
      error: "Longitude must be a number.",
    })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
});

export type CalculateRequest = z.infer<typeof calculateRequestSchema>;
