import {
  badRequestError,
  conflictError,
  notFoundError,
} from "@/lib/api/errors";
import { ensureUserAccount } from "@/lib/accounts/service";
import { createSupabaseServerClient } from "@/lib/clients/supabase";
import { throwIfSupabaseError } from "@/lib/db/errors";
import type {
  LinkedProfileRecord,
  MainProfileRecord,
  ProfileBirthDetails,
  RelationType,
} from "@/lib/profiles/types";
import type {
  LinkedProfileCreateInput,
  LinkedProfileUpdateInput,
  MainProfileUpsertInput,
} from "@/lib/profiles/validation";

function mapMainProfileRow(row: Record<string, unknown>): MainProfileRecord {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    fullName: String(row.full_name),
    birthDate: String(row.birth_date),
    birthTime: String(row.birth_time),
    birthTimezone: String(row.birth_timezone),
    birthLatitude: Number(row.birth_latitude),
    birthLongitude: Number(row.birth_longitude),
    birthPlaceLabel: (row.birth_place_label as string | null) ?? null,
    gender: row.gender as MainProfileRecord["gender"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function mapLinkedProfileRow(row: Record<string, unknown>): LinkedProfileRecord {
  return {
    id: String(row.id),
    mainProfileId: String(row.main_profile_id),
    relationType: row.relation_type as RelationType,
    fullName: String(row.full_name),
    birthDate: String(row.birth_date),
    birthTime: String(row.birth_time),
    birthTimezone: String(row.birth_timezone),
    birthLatitude: Number(row.birth_latitude),
    birthLongitude: Number(row.birth_longitude),
    birthPlaceLabel: (row.birth_place_label as string | null) ?? null,
    gender: row.gender as LinkedProfileRecord["gender"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function toMainProfileDb(input: MainProfileUpsertInput): Record<string, unknown> {
  return {
    full_name: input.fullName,
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    birth_timezone: input.birthTimezone,
    birth_latitude: input.birthLatitude,
    birth_longitude: input.birthLongitude,
    birth_place_label: input.birthPlaceLabel ?? null,
    gender: input.gender,
    deleted_at: null,
  };
}

function toLinkedProfileDb(
  input: LinkedProfileCreateInput | LinkedProfileUpdateInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.birthDate !== undefined) payload.birth_date = input.birthDate;
  if (input.birthTime !== undefined) payload.birth_time = input.birthTime;
  if (input.birthTimezone !== undefined) payload.birth_timezone = input.birthTimezone;
  if (input.birthLatitude !== undefined) payload.birth_latitude = input.birthLatitude;
  if (input.birthLongitude !== undefined) payload.birth_longitude = input.birthLongitude;
  if (input.birthPlaceLabel !== undefined) {
    payload.birth_place_label = input.birthPlaceLabel ?? null;
  }
  if (input.gender !== undefined) payload.gender = input.gender;
  if ("relationType" in input && input.relationType !== undefined) {
    payload.relation_type = input.relationType;
  }

  return payload;
}

function toBirthDetails(profile: MainProfileRecord | LinkedProfileRecord): ProfileBirthDetails {
  return {
    fullName: profile.fullName,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthTimezone: profile.birthTimezone,
    birthLatitude: profile.birthLatitude,
    birthLongitude: profile.birthLongitude,
    birthPlaceLabel: profile.birthPlaceLabel,
    gender: profile.gender,
  };
}

export async function getMainProfileForUser(
  clerkUserId: string,
): Promise<MainProfileRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_main")
    .select(
      "id, clerk_user_id, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(error, "main_profile_fetch_failed", "Failed to fetch main profile");

  if (!data) {
    return null;
  }

  return mapMainProfileRow(data as Record<string, unknown>);
}

export async function getRequiredMainProfileForUser(
  clerkUserId: string,
): Promise<MainProfileRecord> {
  const profile = await getMainProfileForUser(clerkUserId);
  if (!profile) {
    throw notFoundError("Main profile not found");
  }

  return profile;
}

export async function upsertMainProfileForUser(params: {
  clerkUserId: string;
  email?: string | null;
  input: MainProfileUpsertInput;
}): Promise<MainProfileRecord> {
  await ensureUserAccount({
    clerkUserId: params.clerkUserId,
    email: params.email,
  });

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_main")
    .upsert(
      {
        clerk_user_id: params.clerkUserId,
        ...toMainProfileDb(params.input),
      },
      {
        onConflict: "clerk_user_id",
      },
    )
    .select(
      "id, clerk_user_id, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(error, "main_profile_upsert_failed", "Failed to upsert main profile");

  return mapMainProfileRow(data as Record<string, unknown>);
}

export async function listLinkedProfilesForUser(
  clerkUserId: string,
): Promise<LinkedProfileRecord[]> {
  const main = await getMainProfileForUser(clerkUserId);
  if (!main) {
    return [];
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_linked")
    .select(
      "id, main_profile_id, relation_type, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .eq("main_profile_id", main.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  throwIfSupabaseError(
    error,
    "linked_profile_list_failed",
    "Failed to fetch linked profiles",
  );

  return ((data ?? []) as Record<string, unknown>[]).map(mapLinkedProfileRow);
}

export async function createLinkedProfileForUser(params: {
  clerkUserId: string;
  input: LinkedProfileCreateInput;
}): Promise<LinkedProfileRecord> {
  const main = await getRequiredMainProfileForUser(params.clerkUserId);
  const existing = await listLinkedProfilesForUser(params.clerkUserId);

  if (existing.length >= 3) {
    throw conflictError("Main profile can have at most 3 linked profiles");
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_linked")
    .insert({
      main_profile_id: main.id,
      ...toLinkedProfileDb(params.input),
    })
    .select(
      "id, main_profile_id, relation_type, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(
    error,
    "linked_profile_create_failed",
    "Failed to create linked profile",
  );

  return mapLinkedProfileRow(data as Record<string, unknown>);
}

export async function getLinkedProfileForUser(params: {
  clerkUserId: string;
  linkedProfileId: string;
}): Promise<LinkedProfileRecord> {
  const main = await getRequiredMainProfileForUser(params.clerkUserId);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_linked")
    .select(
      "id, main_profile_id, relation_type, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .eq("id", params.linkedProfileId)
    .eq("main_profile_id", main.id)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(
    error,
    "linked_profile_fetch_failed",
    "Failed to fetch linked profile",
  );

  if (!data) {
    throw notFoundError("Linked profile not found");
  }

  return mapLinkedProfileRow(data as Record<string, unknown>);
}

export async function updateLinkedProfileForUser(params: {
  clerkUserId: string;
  linkedProfileId: string;
  input: LinkedProfileUpdateInput;
}): Promise<LinkedProfileRecord> {
  await getLinkedProfileForUser({
    clerkUserId: params.clerkUserId,
    linkedProfileId: params.linkedProfileId,
  });

  const updatePayload = toLinkedProfileDb(params.input);
  if (Object.keys(updatePayload).length === 0) {
    throw badRequestError("No update fields provided");
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_profiles_linked")
    .update(updatePayload)
    .eq("id", params.linkedProfileId)
    .is("deleted_at", null)
    .select(
      "id, main_profile_id, relation_type, full_name, birth_date, birth_time, birth_timezone, birth_latitude, birth_longitude, birth_place_label, gender, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(
    error,
    "linked_profile_update_failed",
    "Failed to update linked profile",
  );

  return mapLinkedProfileRow(data as Record<string, unknown>);
}

export async function softDeleteLinkedProfileForUser(params: {
  clerkUserId: string;
  linkedProfileId: string;
}): Promise<void> {
  await getLinkedProfileForUser({
    clerkUserId: params.clerkUserId,
    linkedProfileId: params.linkedProfileId,
  });

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("user_profiles_linked")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", params.linkedProfileId)
    .is("deleted_at", null);

  throwIfSupabaseError(
    error,
    "linked_profile_delete_failed",
    "Failed to delete linked profile",
  );
}

export async function softDeleteAllLinkedProfilesForMainProfile(
  mainProfileId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("user_profiles_linked")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("main_profile_id", mainProfileId)
    .is("deleted_at", null);

  throwIfSupabaseError(
    error,
    "linked_profile_delete_failed",
    "Failed to delete linked profiles",
  );
}

export async function softDeleteMainProfileForUser(clerkUserId: string): Promise<void> {
  const main = await getMainProfileForUser(clerkUserId);
  if (!main) {
    return;
  }

  await softDeleteAllLinkedProfilesForMainProfile(main.id);

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("user_profiles_main")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", main.id)
    .is("deleted_at", null);

  throwIfSupabaseError(error, "main_profile_delete_failed", "Failed to delete main profile");
}

export function buildProfileSnapshot(
  profile: MainProfileRecord | LinkedProfileRecord,
): ProfileBirthDetails {
  return toBirthDetails(profile);
}
