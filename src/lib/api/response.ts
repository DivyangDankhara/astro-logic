import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiRouteError } from "@/lib/api/errors";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? randomUUID();
}

export function successResponse<T>(
  data: T,
  requestId: string,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
      requestId,
    },
    { status },
  );
}

export function errorResponse(
  error: unknown,
  requestId: string,
  fallbackMessage = "Unexpected server error",
): NextResponse<ApiFailure> {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId,
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: "Invalid request payload",
          details: error.flatten(),
        },
        requestId,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: fallbackMessage,
      },
      requestId,
    },
    { status: 500 },
  );
}
