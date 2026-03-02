import { calculateChartData } from "@/lib/astrology/calculate-engine";
import type { CalculateRequest } from "@/lib/validation/calculate";
import { createSupabaseServerClient } from "@/lib/clients/supabase";
import { throwIfSupabaseError } from "@/lib/db/errors";
import {
  buildProfileSnapshot,
  getLinkedProfileForUser,
  getMainProfileForUser,
  getRequiredMainProfileForUser,
} from "@/lib/profiles/service";
import type {
  KundliRecord,
  KundliStalenessState,
  LinkedProfileRecord,
  MainProfileRecord,
} from "@/lib/profiles/types";

interface KundliReadResult {
  kundli: KundliRecord;
  staleness: KundliStalenessState;
}

function mapKundliRow(row: Record<string, unknown>): KundliRecord {
  return {
    id: String(row.id),
    ownerProfileType: row.owner_profile_type as KundliRecord["ownerProfileType"],
    ownerMainProfileId: (row.owner_main_profile_id as string | null) ?? null,
    ownerLinkedProfileId: (row.owner_linked_profile_id as string | null) ?? null,
    inputSnapshot: (row.input_snapshot as Record<string, unknown> | null) ?? {},
    calculationResult: row.calculation_result as KundliRecord["calculationResult"],
    calculatedAt: String(row.calculated_at),
    profileUpdatedAtSnapshot: String(row.profile_updated_at_snapshot),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function toCalculateRequest(
  profile: MainProfileRecord | LinkedProfileRecord,
): CalculateRequest {
  return {
    fullName: profile.fullName,
    dateOfBirth: profile.birthDate,
    timeOfBirth: profile.birthTime,
    timezone: profile.birthTimezone,
    latitude: profile.birthLatitude,
    longitude: profile.birthLongitude,
  };
}

export function computeKundliStaleness(params: {
  existing: KundliRecord | null;
  profileUpdatedAt: string;
  force: boolean;
}): KundliStalenessState {
  if (params.force) {
    return {
      isStale: true,
      reason: "force",
    };
  }

  if (!params.existing) {
    return {
      isStale: true,
      reason: "missing",
    };
  }

  const profileTime = Date.parse(params.profileUpdatedAt);
  const snapshotTime = Date.parse(params.existing.profileUpdatedAtSnapshot);

  if (profileTime > snapshotTime) {
    return {
      isStale: true,
      reason: "profile_updated",
    };
  }

  return {
    isStale: false,
    reason: "fresh",
  };
}

async function getExistingMainKundli(mainProfileId: string): Promise<KundliRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("kundli_records")
    .select(
      "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
    )
    .eq("owner_profile_type", "main")
    .eq("owner_main_profile_id", mainProfileId)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(error, "kundli_fetch_failed", "Failed to fetch main Kundli");

  if (!data) {
    return null;
  }

  return mapKundliRow(data as Record<string, unknown>);
}

async function getExistingLinkedKundli(linkedProfileId: string): Promise<KundliRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("kundli_records")
    .select(
      "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
    )
    .eq("owner_profile_type", "linked")
    .eq("owner_linked_profile_id", linkedProfileId)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(error, "kundli_fetch_failed", "Failed to fetch linked Kundli");

  if (!data) {
    return null;
  }

  return mapKundliRow(data as Record<string, unknown>);
}

async function upsertMainKundli(params: {
  profile: MainProfileRecord;
}): Promise<KundliRecord> {
  const existing = await getExistingMainKundli(params.profile.id);
  const supabase = createSupabaseServerClient();
  const calculationResult = calculateChartData(toCalculateRequest(params.profile));
  const inputSnapshot = buildProfileSnapshot(params.profile);

  if (!existing) {
    const { data, error } = await supabase
      .from("kundli_records")
      .insert({
        owner_profile_type: "main",
        owner_main_profile_id: params.profile.id,
        input_snapshot: inputSnapshot,
        calculation_result: calculationResult,
        calculated_at: new Date().toISOString(),
        profile_updated_at_snapshot: params.profile.updatedAt,
      })
      .select(
        "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
      )
      .single();

    throwIfSupabaseError(error, "kundli_upsert_failed", "Failed to insert main Kundli");

    return mapKundliRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("kundli_records")
    .update({
      input_snapshot: inputSnapshot,
      calculation_result: calculationResult,
      calculated_at: new Date().toISOString(),
      profile_updated_at_snapshot: params.profile.updatedAt,
      deleted_at: null,
    })
    .eq("id", existing.id)
    .select(
      "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(error, "kundli_upsert_failed", "Failed to update main Kundli");

  return mapKundliRow(data as Record<string, unknown>);
}

async function upsertLinkedKundli(params: {
  profile: LinkedProfileRecord;
}): Promise<KundliRecord> {
  const existing = await getExistingLinkedKundli(params.profile.id);
  const supabase = createSupabaseServerClient();
  const calculationResult = calculateChartData(toCalculateRequest(params.profile));
  const inputSnapshot = buildProfileSnapshot(params.profile);

  if (!existing) {
    const { data, error } = await supabase
      .from("kundli_records")
      .insert({
        owner_profile_type: "linked",
        owner_linked_profile_id: params.profile.id,
        input_snapshot: inputSnapshot,
        calculation_result: calculationResult,
        calculated_at: new Date().toISOString(),
        profile_updated_at_snapshot: params.profile.updatedAt,
      })
      .select(
        "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
      )
      .single();

    throwIfSupabaseError(error, "kundli_upsert_failed", "Failed to insert linked Kundli");

    return mapKundliRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("kundli_records")
    .update({
      input_snapshot: inputSnapshot,
      calculation_result: calculationResult,
      calculated_at: new Date().toISOString(),
      profile_updated_at_snapshot: params.profile.updatedAt,
      deleted_at: null,
    })
    .eq("id", existing.id)
    .select(
      "id, owner_profile_type, owner_main_profile_id, owner_linked_profile_id, input_snapshot, calculation_result, calculated_at, profile_updated_at_snapshot, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(error, "kundli_upsert_failed", "Failed to update linked Kundli");

  return mapKundliRow(data as Record<string, unknown>);
}

export async function getMainKundliForUser(params: {
  clerkUserId: string;
  force?: boolean;
}): Promise<KundliReadResult> {
  const profile = await getRequiredMainProfileForUser(params.clerkUserId);
  const existing = await getExistingMainKundli(profile.id);
  const staleness = computeKundliStaleness({
    existing,
    profileUpdatedAt: profile.updatedAt,
    force: params.force ?? false,
  });

  if (!staleness.isStale && existing) {
    return {
      kundli: existing,
      staleness,
    };
  }

  const refreshed = await upsertMainKundli({ profile });

  return {
    kundli: refreshed,
    staleness,
  };
}

export async function getLinkedKundliForUser(params: {
  clerkUserId: string;
  linkedProfileId: string;
  force?: boolean;
}): Promise<KundliReadResult> {
  const profile = await getLinkedProfileForUser({
    clerkUserId: params.clerkUserId,
    linkedProfileId: params.linkedProfileId,
  });

  const existing = await getExistingLinkedKundli(profile.id);
  const staleness = computeKundliStaleness({
    existing,
    profileUpdatedAt: profile.updatedAt,
    force: params.force ?? false,
  });

  if (!staleness.isStale && existing) {
    return {
      kundli: existing,
      staleness,
    };
  }

  const refreshed = await upsertLinkedKundli({ profile });

  return {
    kundli: refreshed,
    staleness,
  };
}

export async function softDeleteKundliForUser(clerkUserId: string): Promise<void> {
  const main = await getMainProfileForUser(clerkUserId);
  if (!main) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { error: mainError } = await supabase
    .from("kundli_records")
    .update({
      deleted_at: nowIso,
    })
    .eq("owner_profile_type", "main")
    .eq("owner_main_profile_id", main.id)
    .is("deleted_at", null);

  throwIfSupabaseError(mainError, "kundli_delete_failed", "Failed to delete main Kundli");

  const { data: linkedRows, error: linkedFetchError } = await supabase
    .from("user_profiles_linked")
    .select("id")
    .eq("main_profile_id", main.id);

  throwIfSupabaseError(
    linkedFetchError,
    "linked_profile_fetch_failed",
    "Failed to fetch linked profiles for Kundli cleanup",
  );

  for (const row of (linkedRows ?? []) as Array<{ id: string }>) {
    const { error } = await supabase
      .from("kundli_records")
      .update({
        deleted_at: nowIso,
      })
      .eq("owner_profile_type", "linked")
      .eq("owner_linked_profile_id", row.id)
      .is("deleted_at", null);

    throwIfSupabaseError(error, "kundli_delete_failed", "Failed to delete linked Kundli");
  }
}
