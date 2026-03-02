export interface ApiErrorDetails {
  [key: string]: unknown;
}

export class ApiRouteError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function unauthorizedError(message = "Authentication required") {
  return new ApiRouteError(401, "unauthorized", message);
}

export function forbiddenError(message = "Forbidden") {
  return new ApiRouteError(403, "forbidden", message);
}

export function notFoundError(message = "Not found") {
  return new ApiRouteError(404, "not_found", message);
}

export function badRequestError(message = "Bad request", details?: unknown) {
  return new ApiRouteError(400, "bad_request", message, details);
}

export function conflictError(message = "Conflict", details?: unknown) {
  return new ApiRouteError(409, "conflict", message, details);
}

export function rateLimitError(retryAfterSeconds: number) {
  return new ApiRouteError(429, "rate_limited", "Too many requests", {
    retryAfterSeconds,
  });
}
