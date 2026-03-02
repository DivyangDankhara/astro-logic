import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { calculateChartData } from "@/lib/astrology/calculate-engine";
import type { ErrorResponse } from "@/lib/astrology/types";
import { calculateRequestSchema } from "@/lib/validation/calculate";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = await request.json();
    const parsedPayload = calculateRequestSchema.parse(payload);
    const result = calculateChartData(parsedPayload);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      const response: ErrorResponse = {
        error: "Invalid request payload.",
        details: error.flatten(),
      };

      return NextResponse.json(response, { status: 400 });
    }

    const response: ErrorResponse = {
      error: "Failed to calculate chart data.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
