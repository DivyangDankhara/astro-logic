export interface InterpretationSection {
  title: string;
  content: string;
}

export interface InterpretationPayload {
  summary: string;
  sections: InterpretationSection[];
  confidence: "low" | "medium" | "high";
}

export interface InterpretationRecord {
  id: string;
  chartId: string;
  clerkUserId: string;
  model: string;
  interpretation: InterpretationPayload;
  promptVersion: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
