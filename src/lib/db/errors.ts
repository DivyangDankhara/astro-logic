import { ApiRouteError } from "@/lib/api/errors";

interface SupabaseErrorLike {
  message: string;
  code?: string;
}

export function throwIfSupabaseError(
  error: SupabaseErrorLike | null,
  code: string,
  message: string,
): void {
  if (!error) {
    return;
  }

  throw new ApiRouteError(500, code, message, {
    dbCode: error.code,
    dbMessage: error.message,
  });
}
