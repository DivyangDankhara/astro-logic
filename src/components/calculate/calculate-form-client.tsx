"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMMON_TIMEZONES } from "@/lib/astrology/constants";
import type { CalculateResponse, ErrorResponse } from "@/lib/astrology/types";
import {
  calculateRequestSchema,
  type CalculateRequest,
} from "@/lib/validation/calculate";

const TIMEZONE_LIST_ID = "timezone-list";

export function CalculateFormClient() {
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const form = useForm<CalculateRequest>({
    resolver: zodResolver(calculateRequestSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      timeOfBirth: "",
      timezone: "Asia/Kolkata",
      latitude: Number.NaN,
      longitude: Number.NaN,
    },
  });

  async function onSubmit(values: CalculateRequest) {
    setApiError(null);
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorResponse = (await response.json()) as ErrorResponse;
        setResult(null);
        setApiError(errorResponse.error ?? "Calculation failed.");
        return;
      }

      const payload = (await response.json()) as CalculateResponse;
      setResult(payload);
      setShowRawJson(false);
    } catch {
      setResult(null);
      setApiError("Network error while requesting chart calculation.");
    }
  }

  const jsonResult = useMemo(() => {
    if (!result) {
      return "";
    }

    return JSON.stringify(result, null, 2);
  }, [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Enter Birth Details</CardTitle>
          <CardDescription>
            Provide precise local birth data for sidereal chart calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aarav Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => {
                    const parsedDate = field.value ? parseISO(field.value) : undefined;
                    const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className="justify-between font-normal"
                              >
                                {selectedDate
                                  ? format(selectedDate, "PPP")
                                  : "Select your birth date"}
                                <CalendarIcon className="size-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                if (!date) {
                                  field.onChange("");
                                  return;
                                }

                                field.onChange(format(date, "yyyy-MM-dd"));
                              }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="timeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Birth (24h)</FormLabel>
                      <FormControl>
                        <Input type="time" step={60} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Timezone (IANA)</FormLabel>
                    <FormControl>
                      <Input
                        list={TIMEZONE_LIST_ID}
                        placeholder="Asia/Kolkata"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <datalist id={TIMEZONE_LIST_ID}>
                      {COMMON_TIMEZONES.map((timezone) => (
                        <option key={timezone} value={timezone} />
                      ))}
                    </datalist>
                    <FormDescription>
                      Use an IANA timezone such as <code>Asia/Kolkata</code> or{" "}
                      <code>America/New_York</code>.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          placeholder="19.076"
                          value={Number.isFinite(field.value) ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? Number.NaN
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          placeholder="72.8777"
                          value={Number.isFinite(field.value) ? field.value : ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? Number.NaN
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Alert>
                <MapPin className="size-4" />
                <AlertTitle>Location input for MVP</AlertTitle>
                <AlertDescription>
                  Manual latitude/longitude entry is enabled now. Google Maps autocomplete is
                  planned for the next iteration.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Generate Scientific Chart"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Computed Sidereal Results</CardTitle>
          <CardDescription>
            Swiss Ephemeris output using Lahiri ayanamsha and sidereal planetary longitudes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {apiError ? (
            <Alert variant="destructive">
              <AlertTitle>Calculation Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          {!result ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Submit the form to view exact planetary longitudes, rashis, and nakshatras.
            </div>
          ) : (
            <>
              <div className="grid gap-2 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-medium">UTC DateTime:</span> {result.metadata.utcDateTime}
                </p>
                <p>
                  <span className="font-medium">Julian Day (UT):</span> {result.metadata.jdUt}
                </p>
                <p>
                  <span className="font-medium">Sidereal Mode:</span> {result.metadata.siderealMode}
                </p>
                <p>
                  <span className="font-medium">Ayanamsa:</span> {result.metadata.ayanamsa}
                </p>
              </div>

              <Separator />

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

              <Button
                variant="outline"
                onClick={() => setShowRawJson((current) => !current)}
                className="w-full"
              >
                {showRawJson ? "Hide Raw JSON" : "Show Raw JSON"}
              </Button>

              {showRawJson ? (
                <pre className="max-h-72 overflow-auto rounded-lg border bg-slate-950 p-4 text-xs text-slate-100">
                  {jsonResult}
                </pre>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
