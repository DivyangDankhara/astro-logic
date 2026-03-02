import { z } from "zod";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { badRequestError, rateLimitError } from "@/lib/api/errors";
import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { ensureUserAccount } from "@/lib/accounts/service";
import {
  getBillingRateLimitPerMinute,
  getEnv,
  requireEnvValues,
} from "@/lib/config/env";
import { requireAuthUser } from "@/lib/auth/session";
import {
  getSubscriptionForUser,
  setStripeCustomerIdForUser,
} from "@/lib/billing/service";
import { getStripeServerClient } from "@/lib/clients/stripe";
import { checkRateLimit } from "@/lib/rate-limit/memory";

const checkoutInputSchema = z.object({
  priceId: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "NEXT_PUBLIC_APP_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_PRO_PRICE_ID",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
      "billing checkout",
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

    const body = checkoutInputSchema.parse(await request.json());
    const env = getEnv();
    const stripe = getStripeServerClient();

    const subscription = await getSubscriptionForUser(user.userId);
    let stripeCustomerId = subscription.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          clerk_user_id: user.userId,
        },
      });

      stripeCustomerId = customer.id;
      await setStripeCustomerIdForUser(user.userId, customer.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      line_items: [
        {
          price: body.priceId ?? env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        clerk_user_id: user.userId,
      },
      subscription_data: {
        metadata: {
          clerk_user_id: user.userId,
        },
      },
    });

    if (!session.url) {
      throw badRequestError("Unable to create checkout URL");
    }

    await captureServerEvent({
      distinctId: user.userId,
      event: ANALYTICS_EVENTS.checkoutStarted,
      properties: {
        stripeSessionId: session.id,
      },
    });

    return successResponse(
      {
        url: session.url,
      },
      requestId,
      200,
    );
  } catch (error) {
    return errorResponse(error, requestId, "Failed to create checkout session");
  }
}
