import { describe, expect, it } from "vitest";

import { parseInterpretationPayload } from "@/lib/interpretations/schema";

describe("interpretation schema", () => {
  it("parses valid structured payload", () => {
    const parsed = parseInterpretationPayload({
      summary: "Summary text",
      confidence: "medium",
      sections: [
        {
          title: "Career",
          content: "Steady progress with communication-focused work.",
        },
      ],
    });

    expect(parsed.confidence).toBe("medium");
    expect(parsed.sections).toHaveLength(1);
  });

  it("rejects invalid payload", () => {
    expect(() =>
      parseInterpretationPayload({
        summary: "",
        confidence: "high",
        sections: [],
      }),
    ).toThrow();
  });
});
