"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaginatedCharts } from "@/lib/charts/types";

export function ChartListClient() {
  const [charts, setCharts] = useState<PaginatedCharts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCharts() {
      try {
        const response = await fetch("/api/charts?page=1&pageSize=20");
        const payload = (await response.json()) as {
          ok: boolean;
          data?: PaginatedCharts;
          error?: {
            message: string;
          };
        };

        if (!active) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          setError(payload.error?.message ?? "Unable to load chart history.");
          return;
        }

        setCharts(payload.data);
      } catch {
        setError("Unable to load chart history.");
      }
    }

    void loadCharts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Saved Charts</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/calculate">New chart</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load charts</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!error && charts && charts.items.length === 0 ? (
          <p className="text-sm text-slate-600">No saved charts yet. Calculate your first chart.</p>
        ) : null}

        {!error && charts && charts.items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charts.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.fullName}</TableCell>
                  <TableCell>{item.dateOfBirth}</TableCell>
                  <TableCell>{item.timezone}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/charts/${item.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
