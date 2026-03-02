import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { ensureUserAccount } from "@/lib/accounts/service";
import { requireAuthUser } from "@/lib/auth/session";
import { softDeleteAccountData } from "@/lib/account/deletion";
import { requireEnvValues } from "@/lib/config/env";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      "account deletion",
    );

    const user = await requireAuthUser();
    await ensureUserAccount({
      clerkUserId: user.userId,
      email: user.email,
    });

    const result = await softDeleteAccountData(user.userId);

    return successResponse(result, requestId, 200);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to delete account data");
  }
}
