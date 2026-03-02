import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { calculateChartData } from "@/lib/astrology/calculate-engine";
import type { ErrorResponse } from "@/lib/astrology/types";
import { calculateRequestSchema } from "@/lib/validation/calculate";

export const runtime = "nodejs";

type CalculateAdHocResponse = ReturnType<typeof calculateChartData> & {
  meta: {
    storageMode: "local";
  };
};

function toError(message: string, details?: unknown): ErrorResponse {
  return {
    error: message,
    details,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = await request.json();
    const parsedPayload = calculateRequestSchema.parse(payload);
    const result = calculateChartData(parsedPayload);

    const response: CalculateAdHocResponse = {
      ...result,
      meta: {
        storageMode: "local",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        toError("Invalid request payload.", error.flatten()),
        { status: 400 },
      );
    }

    return NextResponse.json(toError("Failed to calculate chart data."), {
      status: 500,
    });
  }
}
