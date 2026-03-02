import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { requireEnvValues } from "@/lib/config/env";
import { getLinkedKundliForUser } from "@/lib/kundli/service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      "kundli linked",
    );

    const user = await requireAuthUser();
    const force = new URL(request.url).searchParams.get("force") === "true";
    const { id } = await context.params;

    const result = await getLinkedKundliForUser({
      clerkUserId: user.userId,
      linkedProfileId: id,
      force,
    });

    return successResponse(result, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch linked Kundli");
  }
}
