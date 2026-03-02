import { createSupabaseServerClient } from "@/lib/clients/supabase";
import { throwIfSupabaseError } from "@/lib/db/errors";

export interface AccountIdentity {
  clerkUserId: string;
  email?: string | null;
}

export interface UserAccountRecord {
  clerkUserId: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapUserAccountRow(row: Record<string, unknown>): UserAccountRecord {
  return {
    clerkUserId: String(row.clerk_user_id),
    email: (row.email as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export async function ensureUserAccount(identity: AccountIdentity): Promise<UserAccountRecord> {
  const supabase = createSupabaseServerClient();
  const upsertPayload: Record<string, unknown> = {
    clerk_user_id: identity.clerkUserId,
    deleted_at: null,
  };

  if (identity.email !== undefined) {
    upsertPayload.email = identity.email;
  }

  const { data, error } = await supabase
    .from("user_accounts")
    .upsert(upsertPayload, {
      onConflict: "clerk_user_id",
    })
    .select("clerk_user_id, email, created_at, updated_at, deleted_at")
    .single();

  throwIfSupabaseError(error, "user_account_upsert_failed", "Failed to upsert user account");

  return mapUserAccountRow(data as Record<string, unknown>);
}

export async function softDeleteUserAccount(clerkUserId: string): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("user_accounts")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId);

  throwIfSupabaseError(error, "user_account_delete_failed", "Failed to soft delete user account");
}
