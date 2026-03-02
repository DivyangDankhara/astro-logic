"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountSettingsClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccountData() {
    const confirmed = window.confirm(
      "This will soft delete your account data and saved charts. Continue?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          purgeAfterDays: number;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to process deletion request.");
        return;
      }

      setMessage(
        `Your data is marked for deletion and will be permanently purged after ${payload.data.purgeAfterDays} days.`,
      );
    } catch {
      setError("Unable to process deletion request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Retention and Deletion</CardTitle>
        <CardDescription>
          Main profile, linked profiles, Kundli records, and legacy account data are retained
          until you request deletion. Deletion is soft-deleted first and permanently purged
          after retention policy period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="destructive" onClick={() => void deleteAccountData()} disabled={loading}>
          {loading ? "Processing..." : "Delete my data"}
        </Button>

        {message ? (
          <Alert>
            <AlertTitle>Deletion requested</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Deletion failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
