import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { requireEnvValues } from "@/lib/config/env";
import { getMainKundliForUser } from "@/lib/kundli/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      "kundli main",
    );

    const user = await requireAuthUser();
    const force = new URL(request.url).searchParams.get("force") === "true";

    const result = await getMainKundliForUser({
      clerkUserId: user.userId,
      force,
    });

    return successResponse(result, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch main Kundli");
  }
}
