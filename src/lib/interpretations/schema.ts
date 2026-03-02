import { z } from "zod";

import type { InterpretationPayload } from "@/lib/interpretations/types";

const interpretationSectionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const interpretationPayloadSchema = z.object({
  summary: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  sections: z.array(interpretationSectionSchema).min(1).max(8),
});

export function parseInterpretationPayload(input: unknown): InterpretationPayload {
  return interpretationPayloadSchema.parse(input);
}
