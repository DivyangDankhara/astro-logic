"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  deleteAdHocHistoryRecord,
  getAdHocHistoryById,
} from "@/lib/charts/ad-hoc-history";

interface GuestHistoryDetailClientProps {
  id: string;
}

export function GuestHistoryDetailClient({ id }: GuestHistoryDetailClientProps) {
  const router = useRouter();
  const record = useMemo(() => getAdHocHistoryById(id), [id]);

  if (!record) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Entry not found</AlertTitle>
        <AlertDescription>
          This local history entry is missing or was removed from this browser.
        </AlertDescription>
      </Alert>
    );
  }

  function deleteEntry() {
    deleteAdHocHistoryRecord(id);
    router.push("/guest-charts");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{record.personName}</CardTitle>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/calculate">Recalculate</Link>
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteEntry}>
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>DOB: {record.birthInput.dateOfBirth}</p>
          <p>Birth time: {record.birthInput.timeOfBirth}</p>
          <p>Timezone: {record.birthInput.timezone}</p>
          <p>Coordinates: {record.birthInput.latitude}, {record.birthInput.longitude}</p>
          <p>Created: {new Date(record.createdAt).toLocaleString()}</p>
          <p>
            Origin: <Badge variant="secondary">{record.origin}</Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planetary Positions</CardTitle>
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
              {record.calculationResult.bodies.map((body) => (
                <TableRow key={body.key}>
                  <TableCell className="font-medium">{body.name}</TableCell>
                  <TableCell>
                    {body.longitude.toFixed(6)} deg
                    <div className="text-muted-foreground text-xs">{body.longitudeDms}</div>
                  </TableCell>
                  <TableCell>{body.retrograde ? "Retrograde" : "Direct"}</TableCell>
                  <TableCell>{body.rashi}</TableCell>
                  <TableCell>{body.nakshatra}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
