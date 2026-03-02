import OpenAI from "openai";

import { ApiRouteError } from "@/lib/api/errors";
import { getEnv, requireEnvValues } from "@/lib/config/env";
import { parseInterpretationPayload } from "@/lib/interpretations/schema";
import type {
  InterpretationGenerationInput,
  InterpretationGenerationResult,
  InterpretationProvider,
} from "@/lib/interpretations/provider";

function createInterpretationPrompt(input: InterpretationGenerationInput): string {
  const chart = input.chart;
  const bodies = chart.calculationResult.bodies.map((body) => ({
    name: body.name,
    longitude: body.longitude,
    retrograde: body.retrograde,
    rashi: body.rashi,
    nakshatra: body.nakshatra,
  }));

  return JSON.stringify(
    {
      instruction:
        "Create a structured Vedic chart interpretation for educational purposes with neutral tone and concrete observations. Do not include medical, legal, or financial advice.",
      requiredFormat: {
        summary: "string",
        confidence: "low|medium|high",
        sections: [
          {
            title: "string",
            content: "string",
          },
        ],
      },
      chart: {
        metadata: chart.calculationResult.metadata,
        bodies,
      },
    },
    null,
    2,
  );
}

export class OpenAiInterpretationProvider implements InterpretationProvider {
  readonly model: string;
  private readonly client: OpenAI;

  constructor() {
    requireEnvValues(["OPENAI_API_KEY"], "AI interpretations");
    const env = getEnv();

    this.model = env.OPENAI_MODEL;
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async generate(
    input: InterpretationGenerationInput,
  ): Promise<InterpretationGenerationResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an astrology analysis assistant. Return valid JSON only, without markdown wrappers.",
        },
        {
          role: "user",
          content: createInterpretationPrompt(input),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new ApiRouteError(502, "ai_empty_response", "AI response was empty");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new ApiRouteError(502, "ai_invalid_json", "AI response was not valid JSON");
    }

    const interpretation = parseInterpretationPayload(parsedJson);

    return {
      interpretation,
      metadata: {
        promptVersion: input.promptVersion,
        model: this.model,
        inputTokens: completion.usage?.prompt_tokens ?? null,
        outputTokens: completion.usage?.completion_tokens ?? null,
        totalTokens: completion.usage?.total_tokens ?? null,
      },
    };
  }
}
