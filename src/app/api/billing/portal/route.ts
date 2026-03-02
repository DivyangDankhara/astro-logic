import { badRequestError, rateLimitError } from "@/lib/api/errors";
import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { ensureUserAccount } from "@/lib/accounts/service";
import { requireAuthUser } from "@/lib/auth/session";
import {
  getBillingRateLimitPerMinute,
  getEnv,
  requireEnvValues,
} from "@/lib/config/env";
import { getSubscriptionForUser } from "@/lib/billing/service";
import { getStripeServerClient } from "@/lib/clients/stripe";
import { checkRateLimit } from "@/lib/rate-limit/memory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_APP_URL",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
      "billing portal",
    );

    const user = await requireAuthUser();
    await ensureUserAccount({
      clerkUserId: user.userId,
      email: user.email,
    });

    const rateLimit = checkRateLimit("billing", user.userId, {
      limit: getBillingRateLimitPerMinute(),
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      throw rateLimitError(rateLimit.retryAfterSeconds);
    }

    const subscription = await getSubscriptionForUser(user.userId);
    if (!subscription.stripeCustomerId) {
      throw badRequestError("No Stripe customer found for this account");
    }

    const stripe = getStripeServerClient();
    const env = getEnv();

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return successResponse(
      {
        url: session.url,
      },
      requestId,
      200,
    );
  } catch (error) {
    return errorResponse(error, requestId, "Failed to create billing portal session");
  }
}
