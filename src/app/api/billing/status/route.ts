import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { ensureUserAccount } from "@/lib/accounts/service";
import { requireAuthUser } from "@/lib/auth/session";
import { getBillingStatus } from "@/lib/billing/service";
import { requireEnvValues } from "@/lib/config/env";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      "billing status",
    );

    const user = await requireAuthUser();
    await ensureUserAccount({
      clerkUserId: user.userId,
      email: user.email,
    });

    const status = await getBillingStatus(user.userId);

    await captureServerEvent({
      distinctId: user.userId,
      event: ANALYTICS_EVENTS.pricingViewed,
      properties: {
        planTier: status.planTier,
      },
    });

    return successResponse(status, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to fetch billing status");
  }
}
