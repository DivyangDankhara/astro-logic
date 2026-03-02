"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

interface AstroPostHogProviderProps {
  apiKey?: string;
  host?: string;
  children: React.ReactNode;
}

export function AstroPostHogProvider({
  apiKey,
  host,
  children,
}: AstroPostHogProviderProps) {
  useEffect(() => {
    if (!apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: true,
    });
  }, [apiKey, host]);

  if (!apiKey) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
