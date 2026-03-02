"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KundliView } from "@/components/kundli/kundli-view";
import type { KundliRecord, KundliStalenessState } from "@/lib/profiles/types";

interface LinkedKundliResponse {
  kundli: KundliRecord;
  staleness: KundliStalenessState;
}

interface LinkedKundliClientProps {
  linkedProfileId: string;
}

export function LinkedKundliClient({ linkedProfileId }: LinkedKundliClientProps) {
  const [data, setData] = useState<LinkedKundliResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/kundli/linked/${linkedProfileId}${force ? "?force=true" : ""}`,
      );
      const payload = (await response.json()) as {
        ok: boolean;
        data?: LinkedKundliResponse;
        error?: { message: string };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to load linked Kundli.");
        return;
      }

      setData(payload.data);
    } catch {
      setError("Unable to load linked Kundli.");
    } finally {
      setLoading(false);
    }
  }, [linkedProfileId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={() => void load(true)} disabled={loading}>
          {loading ? "Loading..." : "Recalculate now"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/profile/linked">Back to linked profiles</Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Linked Kundli unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!error && loading ? <p className="text-sm text-slate-600">Loading Kundli...</p> : null}

      {!error && data ? <KundliView kundli={data.kundli} staleness={data.staleness} /> : null}
    </div>
  );
}
