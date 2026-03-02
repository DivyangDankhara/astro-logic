import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KundliRecord, KundliStalenessState } from "@/lib/profiles/types";

interface KundliViewProps {
  kundli: KundliRecord;
  staleness: KundliStalenessState;
}

export function KundliView({ kundli, staleness }: KundliViewProps) {
  const result = kundli.calculationResult;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kundli Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Calculated at:</span>{" "}
            {new Date(kundli.calculatedAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Staleness check:</span>{" "}
            <Badge variant={staleness.isStale ? "destructive" : "secondary"}>
              {staleness.reason}
            </Badge>
          </p>
          <p>
            <span className="font-medium">UTC DateTime:</span> {result.metadata.utcDateTime}
          </p>
          <p>
            <span className="font-medium">Julian Day:</span> {result.metadata.jdUt}
          </p>
          <p>
            <span className="font-medium">Ayanamsa:</span> {result.metadata.ayanamsa}
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
              {result.bodies.map((body) => (
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
