import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { requireEnvValues } from "@/lib/config/env";
import {
  getLinkedProfileForUser,
  softDeleteLinkedProfileForUser,
  updateLinkedProfileForUser,
} from "@/lib/profiles/service";
import { linkedProfileUpdateSchema } from "@/lib/profiles/validation";

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
      "profile linked",
    );

    const user = await requireAuthUser();
    const { id } = await context.params;
    const linkedProfile = await getLinkedProfileForUser({
      clerkUserId: user.userId,
      linkedProfileId: id,
    });

    return successResponse({ linkedProfile }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch linked profile");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      "profile linked",
    );

    const user = await requireAuthUser();
    const payload = linkedProfileUpdateSchema.parse(await request.json());
    const { id } = await context.params;

    const linkedProfile = await updateLinkedProfileForUser({
      clerkUserId: user.userId,
      linkedProfileId: id,
      input: payload,
    });

    return successResponse({ linkedProfile }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to update linked profile");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      "profile linked",
    );

    const user = await requireAuthUser();
    const { id } = await context.params;

    await softDeleteLinkedProfileForUser({
      clerkUserId: user.userId,
      linkedProfileId: id,
    });

    return successResponse({ deleted: true }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to delete linked profile");
  }
}
