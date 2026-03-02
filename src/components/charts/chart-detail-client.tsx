"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ChartRecord } from "@/lib/charts/types";
import type { InterpretationPayload } from "@/lib/interpretations/types";

interface ChartDetailClientProps {
  chartId: string;
}

export function ChartDetailClient({ chartId }: ChartDetailClientProps) {
  const router = useRouter();
  const [chart, setChart] = useState<ChartRecord | null>(null);
  const [interpretation, setInterpretation] = useState<InterpretationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadChart() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/charts/${chartId}`);
        const payload = (await response.json()) as {
          ok: boolean;
          data?: ChartRecord;
          error?: {
            message: string;
          };
        };

        if (!active) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          setError(payload.error?.message ?? "Unable to load chart.");
          return;
        }

        setChart(payload.data);
      } catch {
        setError("Unable to load chart.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadChart();

    return () => {
      active = false;
    };
  }, [chartId]);

  async function generateInterpretation(forceRefresh = false) {
    setLoadingInterpretation(true);
    setError(null);

    try {
      const response = await fetch("/api/interpretations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chartId,
          forceRefresh,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          interpretation: InterpretationPayload;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to generate interpretation.");
        return;
      }

      setInterpretation(payload.data.interpretation);
    } catch {
      setError("Unable to generate interpretation.");
    } finally {
      setLoadingInterpretation(false);
    }
  }

  async function deleteChart() {
    setError(null);

    try {
      const response = await fetch(`/api/charts/${chartId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Unable to delete chart.");
        return;
      }

      router.push("/charts");
    } catch {
      setError("Unable to delete chart.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="size-4 animate-spin" />
        Loading chart...
      </div>
    );
  }

  if (!chart) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Chart unavailable</AlertTitle>
        <AlertDescription>{error ?? "Chart could not be found."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{chart.birthInput.fullName}</CardTitle>
          <Button variant="destructive" size="sm" onClick={() => void deleteChart()}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>Date of birth: {chart.birthInput.dateOfBirth}</p>
          <p>Time of birth: {chart.birthInput.timeOfBirth}</p>
          <p>Timezone: {chart.birthInput.timezone}</p>
          <p>Generated: {new Date(chart.createdAt).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Computed Bodies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Body</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Motion</TableHead>
                <TableHead>Rashi</TableHead>
                <TableHead>Nakshatra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chart.calculationResult.bodies.map((body) => (
                <TableRow key={body.key}>
                  <TableCell className="font-medium">{body.name}</TableCell>
                  <TableCell>{body.longitude.toFixed(6)} deg</TableCell>
                  <TableCell>
                    {body.retrograde ? (
                      <Badge variant="destructive">Retrograde</Badge>
                    ) : (
                      <Badge variant="secondary">Direct</Badge>
                    )}
                  </TableCell>
                  <TableCell>{body.rashi}</TableCell>
                  <TableCell>{body.nakshatra}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Interpretation</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingInterpretation}
              onClick={() => void generateInterpretation(false)}
            >
              {loadingInterpretation ? <Loader2 className="size-4 animate-spin" /> : null}
              {interpretation ? "Reload cached" : "Generate"}
            </Button>
            <Button
              size="sm"
              disabled={loadingInterpretation}
              onClick={() => void generateInterpretation(true)}
            >
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!interpretation ? (
            <p className="text-sm text-slate-600">
              Generate a structured interpretation for this chart. Pro plan required.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-700">{interpretation.summary}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Confidence: {interpretation.confidence}
              </p>
              <div className="space-y-3">
                {interpretation.sections.map((section) => (
                  <div key={section.title} className="rounded-md border p-3">
                    <p className="font-medium">{section.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{section.content}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
