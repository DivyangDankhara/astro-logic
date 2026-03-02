import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { requireEnvValues } from "@/lib/config/env";
import {
  createLinkedProfileForUser,
  listLinkedProfilesForUser,
} from "@/lib/profiles/service";
import { linkedProfileCreateSchema } from "@/lib/profiles/validation";

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
      "profile linked",
    );

    const user = await requireAuthUser();
    const linkedProfiles = await listLinkedProfilesForUser(user.userId);

    return successResponse({ linkedProfiles }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch linked profiles");
  }
}

export async function POST(request: Request) {
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
    const payload = linkedProfileCreateSchema.parse(await request.json());

    const linkedProfile = await createLinkedProfileForUser({
      clerkUserId: user.userId,
      input: payload,
    });

    return successResponse({ linkedProfile }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to create linked profile");
  }
}
