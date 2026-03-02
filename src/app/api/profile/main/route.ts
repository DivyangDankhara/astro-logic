import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { requireEnvValues } from "@/lib/config/env";
import {
  getMainProfileForUser,
  upsertMainProfileForUser,
} from "@/lib/profiles/service";
import { mainProfileUpsertSchema } from "@/lib/profiles/validation";

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
      "profile main",
    );

    const user = await requireAuthUser();
    const mainProfile = await getMainProfileForUser(user.userId);

    return successResponse({ mainProfile }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch main profile");
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      "profile main",
    );

    const user = await requireAuthUser();
    const payload = mainProfileUpsertSchema.parse(await request.json());

    const mainProfile = await upsertMainProfileForUser({
      clerkUserId: user.userId,
      email: user.email,
      input: payload,
    });

    return successResponse({ mainProfile }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to update main profile");
  }
}
