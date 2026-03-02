"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GooglePlaceAutocomplete } from "@/components/location/google-place-autocomplete";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MainProfileRecord } from "@/lib/profiles/types";
import { mainProfileUpsertSchema } from "@/lib/profiles/validation";

interface MainProfileClientProps {
  googleMapsApiKey?: string;
}

interface MainProfileForm {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthTimezone: string;
  birthLatitude: number;
  birthLongitude: number;
  birthPlaceLabel: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
}

const DEFAULT_FORM: MainProfileForm = {
  fullName: "",
  birthDate: "",
  birthTime: "",
  birthTimezone: "Asia/Kolkata",
  birthLatitude: Number.NaN,
  birthLongitude: Number.NaN,
  birthPlaceLabel: "",
  gender: "prefer_not_to_say",
};

function fromRecord(record: MainProfileRecord): MainProfileForm {
  return {
    fullName: record.fullName,
    birthDate: record.birthDate,
    birthTime: record.birthTime,
    birthTimezone: record.birthTimezone,
    birthLatitude: record.birthLatitude,
    birthLongitude: record.birthLongitude,
    birthPlaceLabel: record.birthPlaceLabel ?? "",
    gender: record.gender,
  };
}

export function MainProfileClient({ googleMapsApiKey }: MainProfileClientProps) {
  const [form, setForm] = useState<MainProfileForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/profile/main");
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            mainProfile: MainProfileRecord | null;
          };
          error?: {
            message: string;
          };
        };

        if (!active) {
          return;
        }

        if (!response.ok || !payload.ok || !payload.data) {
          setError(payload.error?.message ?? "Unable to load main profile.");
          return;
        }

        if (payload.data.mainProfile) {
          setForm(fromRecord(payload.data.mainProfile));
        }
      } catch {
        if (active) {
          setError("Unable to load main profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const isCoordinatesValid = useMemo(
    () => Number.isFinite(form.birthLatitude) && Number.isFinite(form.birthLongitude),
    [form.birthLatitude, form.birthLongitude],
  );

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = mainProfileUpsertSchema.parse({
        ...form,
        birthPlaceLabel: form.birthPlaceLabel || null,
      });

      const response = await fetch("/api/profile/main", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          mainProfile: MainProfileRecord;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to save main profile.");
        return;
      }

      setForm(fromRecord(payload.data.mainProfile));
      setSuccess("Main profile saved.");
    } catch {
      setError("Profile data is invalid. Check date, time, timezone, and coordinates.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading main profile...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Main Profile</CardTitle>
          <CardDescription>
            This is your canonical profile. Main Kundli is generated from this information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Profile error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {success ? (
            <Alert>
              <AlertTitle>Saved</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value as MainProfileForm["gender"],
                  }))
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Date</label>
              <Input
                type="date"
                value={form.birthDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Birth Time</label>
              <Input
                type="time"
                value={form.birthTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthTime: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={form.birthTimezone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthTimezone: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Birth Place Search (Google Maps)</label>
            <GooglePlaceAutocomplete
              apiKey={googleMapsApiKey}
              value={form.birthPlaceLabel}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  birthPlaceLabel: value,
                }))
              }
              onPlaceSelected={(selection) =>
                setForm((current) => ({
                  ...current,
                  birthLatitude: selection.latitude,
                  birthLongitude: selection.longitude,
                  birthPlaceLabel: selection.label,
                }))
              }
            />
            {!googleMapsApiKey ? (
              <p className="text-xs text-slate-600">
                Google Maps API key is missing. Use manual latitude/longitude below.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Latitude</label>
              <Input
                type="number"
                step="any"
                value={Number.isFinite(form.birthLatitude) ? form.birthLatitude : ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthLatitude:
                      event.target.value === "" ? Number.NaN : Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Longitude</label>
              <Input
                type="number"
                step="any"
                value={Number.isFinite(form.birthLongitude) ? form.birthLongitude : ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    birthLongitude:
                      event.target.value === "" ? Number.NaN : Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          {!isCoordinatesValid ? (
            <p className="text-xs text-amber-700">
              Latitude/longitude are required for Kundli generation.
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button onClick={() => void saveProfile()} disabled={saving}>
              {saving ? "Saving..." : "Save Main Profile"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/kundli/main">View Main Kundli</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile/linked">Manage Linked Profiles</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
