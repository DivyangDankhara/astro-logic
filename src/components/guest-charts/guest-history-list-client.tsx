"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  clearAdHocHistory,
  listAdHocHistory,
} from "@/lib/charts/ad-hoc-history";
import type { AdHocLocalHistoryRecord } from "@/lib/profiles/types";

export function GuestHistoryListClient() {
  const [items, setItems] = useState<AdHocLocalHistoryRecord[]>(() => listAdHocHistory());

  function clearAll() {
    clearAdHocHistory();
    setItems([]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ad-hoc Local History</CardTitle>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/calculate">New ad-hoc calculation</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAll} disabled={items.length === 0}>
            Clear local history
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTitle>Local only storage</AlertTitle>
          <AlertDescription>
            These entries are stored only in this browser and are never synced to the server.
          </AlertDescription>
        </Alert>

        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No ad-hoc calculations stored yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.personName}</TableCell>
                  <TableCell>{item.birthInput.dateOfBirth}</TableCell>
                  <TableCell>{item.birthInput.timezone}</TableCell>
                  <TableCell>{item.origin}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/guest-charts/${item.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
