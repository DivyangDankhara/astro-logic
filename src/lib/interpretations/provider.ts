import type { ChartRecord } from "@/lib/charts/types";
import type { InterpretationPayload } from "@/lib/interpretations/types";

export interface InterpretationGenerationInput {
  chart: ChartRecord;
  promptVersion: string;
}

export interface InterpretationGenerationResult {
  interpretation: InterpretationPayload;
  metadata: Record<string, unknown>;
}

export interface InterpretationProvider {
  model: string;
  generate(input: InterpretationGenerationInput): Promise<InterpretationGenerationResult>;
}
