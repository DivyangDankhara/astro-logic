import { PostHog } from "posthog-node";

import { getEnv, getServerPostHogKey } from "@/lib/config/env";

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  const env = getEnv();
  const apiKey = getServerPostHogKey();

  if (!apiKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: env.POSTHOG_HOST,
    });
  }

  return posthogClient;
}

export interface ServerAnalyticsEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}

export async function captureServerEvent(payload: ServerAnalyticsEvent): Promise<void> {
  const client = getPostHogClient();

  if (!client) {
    return;
  }

  await client.capture({
    distinctId: payload.distinctId,
    event: payload.event,
    properties: payload.properties,
  });
}
