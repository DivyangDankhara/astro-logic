import { createHash } from "node:crypto";

import type Stripe from "stripe";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { badRequestError } from "@/lib/api/errors";
import { errorResponse, getRequestId, successResponse } from "@/lib/api/response";
import { ensureUserAccount } from "@/lib/accounts/service";
import {
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
  markWebhookEventProcessed,
  setStripeCustomerIdForUser,
  upsertFromStripeSubscription,
} from "@/lib/billing/service";
import { getStripeServerClient } from "@/lib/clients/stripe";
import { getEnv, requireEnvValues } from "@/lib/config/env";

export const runtime = "nodejs";

function getStringFromStripeExpandable(value: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

async function resolveClerkUserIdFromSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.clerk_user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const bySubscriptionId = await getSubscriptionByStripeSubscriptionId(subscription.id);
  if (bySubscriptionId) {
    return bySubscriptionId.clerkUserId;
  }

  const customerId = getStringFromStripeExpandable(subscription.customer);
  const byCustomerId = await getSubscriptionByStripeCustomerId(customerId);

  return byCustomerId?.clerkUserId ?? null;
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
  const clerkUserId = await resolveClerkUserIdFromSubscription(subscription);
  if (!clerkUserId) {
    return;
  }

  await ensureUserAccount({ clerkUserId });
  const nextSubscription = await upsertFromStripeSubscription(subscription, clerkUserId);

  await captureServerEvent({
    distinctId: clerkUserId,
    event: ANALYTICS_EVENTS.subscriptionStatusChanged,
    properties: {
      status: nextSubscription.status,
      planTier: nextSubscription.planTier,
      currentPeriodEnd: nextSubscription.currentPeriodEnd,
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadataUserId = session.metadata?.clerk_user_id ?? null;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  let clerkUserId = metadataUserId;
  if (!clerkUserId && customerId) {
    const subscription = await getSubscriptionByStripeCustomerId(customerId);
    clerkUserId = subscription?.clerkUserId ?? null;
  }

  if (!clerkUserId) {
    return;
  }

  await ensureUserAccount({ clerkUserId });

  if (customerId) {
    await setStripeCustomerIdForUser(clerkUserId, customerId);
  }

  const stripe = getStripeServerClient();
  if (typeof session.subscription === "string") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await upsertFromStripeSubscription(subscription, clerkUserId);
  }

  await captureServerEvent({
    distinctId: clerkUserId,
    event: ANALYTICS_EVENTS.checkoutCompleted,
    properties: {
      stripeSessionId: session.id,
      stripeCustomerId: customerId,
    },
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    requireEnvValues(
      [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
      "Stripe webhook",
    );

    const stripe = getStripeServerClient();
    const env = getEnv();

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw badRequestError("Missing Stripe signature header");
    }

    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      throw badRequestError("Invalid Stripe webhook signature");
    }

    const payloadHash = createHash("sha256").update(rawBody).digest("hex");

    const isNewEvent = await markWebhookEventProcessed({
      stripeEventId: event.id,
      eventType: event.type,
      payloadHash,
    });

    if (!isNewEvent) {
      return successResponse({ received: true, duplicate: true }, requestId);
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
    }

    return successResponse({ received: true, duplicate: false }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, "Failed to process Stripe webhook");
  }
}
