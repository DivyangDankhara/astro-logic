"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GooglePlaceAutocomplete } from "@/components/location/google-place-autocomplete";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LinkedProfileRecord, RelationType } from "@/lib/profiles/types";
import {
  linkedProfileCreateSchema,
  linkedProfileUpdateSchema,
} from "@/lib/profiles/validation";

interface LinkedProfilesClientProps {
  googleMapsApiKey?: string;
}

interface LinkedProfileForm {
  relationType: RelationType;
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthTimezone: string;
  birthLatitude: number;
  birthLongitude: number;
  birthPlaceLabel: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
}

const DEFAULT_FORM: LinkedProfileForm = {
  relationType: "partner",
  fullName: "",
  birthDate: "",
  birthTime: "",
  birthTimezone: "Asia/Kolkata",
  birthLatitude: Number.NaN,
  birthLongitude: Number.NaN,
  birthPlaceLabel: "",
  gender: "prefer_not_to_say",
};

function fromRecord(record: LinkedProfileRecord): LinkedProfileForm {
  return {
    relationType: record.relationType,
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

export function LinkedProfilesClient({ googleMapsApiKey }: LinkedProfilesClientProps) {
  const [items, setItems] = useState<LinkedProfileRecord[]>([]);
  const [form, setForm] = useState<LinkedProfileForm>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateNew = useMemo(() => items.length < 3 || editingId !== null, [editingId, items.length]);

  async function loadItems() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/linked");
      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          linkedProfiles: LinkedProfileRecord[];
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to load linked profiles.");
        return;
      }

      setItems(payload.data.linkedProfiles);
    } catch {
      setError("Unable to load linked profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function submit() {
    if (!canCreateNew) {
      setError("You can only keep up to 3 linked profiles.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const payload = linkedProfileUpdateSchema.parse({
          ...form,
          birthPlaceLabel: form.birthPlaceLabel || null,
        });

        const response = await fetch(`/api/profile/linked/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const parsed = (await response.json()) as {
          ok: boolean;
          error?: { message: string };
        };

        if (!response.ok || !parsed.ok) {
          setError(parsed.error?.message ?? "Unable to update linked profile.");
          return;
        }
      } else {
        const payload = linkedProfileCreateSchema.parse({
          ...form,
          birthPlaceLabel: form.birthPlaceLabel || null,
        });

        const response = await fetch("/api/profile/linked", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const parsed = (await response.json()) as {
          ok: boolean;
          error?: { message: string };
        };

        if (!response.ok || !parsed.ok) {
          setError(parsed.error?.message ?? "Unable to create linked profile.");
          return;
        }
      }

      setForm(DEFAULT_FORM);
      setEditingId(null);
      await loadItems();
    } catch {
      setError("Linked profile data is invalid.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLinkedProfile(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/profile/linked/${id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Unable to delete linked profile.");
        return;
      }

      if (editingId === id) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }

      await loadItems();
    } catch {
      setError("Unable to delete linked profile.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Linked Profiles</CardTitle>
          <CardDescription>
            Add up to 3 linked profiles for partner and children.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Linked profile error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {loading ? <p className="text-sm text-slate-600">Loading linked profiles...</p> : null}

          {!loading && items.length === 0 ? (
            <p className="text-sm text-slate-600">No linked profiles yet.</p>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{item.fullName} ({item.relationType})</p>
                  <p>{item.birthDate} {item.birthTime} {item.birthTimezone}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm(fromRecord(item));
                      }}
                    >
                      Edit
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/kundli/linked/${item.id}`}>View Kundli</Link>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void deleteLinkedProfile(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Linked Profile" : "Add Linked Profile"}</CardTitle>
          <CardDescription>
            {editingId ? "Update linked profile details." : "Create a new linked profile."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canCreateNew && !editingId ? (
            <Alert>
              <AlertTitle>Limit reached</AlertTitle>
              <AlertDescription>
                You have reached the maximum of 3 linked profiles.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Relation Type</label>
              <select
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={form.relationType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    relationType: event.target.value as RelationType,
                  }))
                }
              >
                <option value="partner">Partner</option>
                <option value="child">Child</option>
              </select>
            </div>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value as LinkedProfileForm["gender"],
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

          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={saving || (!canCreateNew && !editingId)}>
              {saving ? "Saving..." : editingId ? "Update Linked Profile" : "Add Linked Profile"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(DEFAULT_FORM);
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
