"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillingStatus } from "@/lib/billing/types";

interface BillingStatusResponse {
  ok: boolean;
  data?: BillingStatus;
  error?: {
    message: string;
  };
}

export function PricingClient() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/billing/status");
        const payload = (await response.json()) as BillingStatusResponse;

        if (!active) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          return;
        }

        setStatus(payload.data);
      } catch {
        // Keep pricing page usable without billing status.
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: { url: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.ok || !payload.data?.url) {
        setError(payload.error?.message ?? "Unable to start checkout.");
        return;
      }

      window.location.assign(payload.data.url);
    } catch {
      setError("Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: { url: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.ok || !payload.data?.url) {
        setError(payload.error?.message ?? "Unable to open billing portal.");
        return;
      }

      window.location.assign(payload.data.url);
    } catch {
      setError("Unable to open billing portal.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = status?.planTier === "pro";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Free
            <Badge variant="secondary">3 charts/month</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Authenticated chart calculation with monthly quota.</p>
          <p>Main profile and linked profile management.</p>
          <p>AI interpretations unavailable.</p>
        </CardContent>
      </Card>

      <Card className="border-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pro
            <Badge>$9/month</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Unlimited chart calculations.</p>
          <p>Full profile-based Kundli experience.</p>
          <p>AI interpretations included.</p>
          <div className="pt-2">
            {isPro ? (
              <Button onClick={() => void openPortal()} disabled={loading}>
                Manage Subscription
              </Button>
            ) : (
              <Button onClick={() => void startCheckout()} disabled={loading}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive" className="md:col-span-2">
          <AlertTitle>Billing action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
