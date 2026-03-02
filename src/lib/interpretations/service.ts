import { createHash } from "node:crypto";

import { forbiddenError } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/clients/supabase";
import {
  getAiRolloutPercent,
  getCanaryUserIds,
  getEnv,
  isFeatureEnabled,
} from "@/lib/config/env";
import { throwIfSupabaseError } from "@/lib/db/errors";
import type { InterpretationPayload, InterpretationRecord } from "@/lib/interpretations/types";

function mapInterpretationRow(row: Record<string, unknown>): InterpretationRecord {
  return {
    id: String(row.id),
    chartId: String(row.chart_id),
    clerkUserId: String(row.clerk_user_id),
    model: String(row.model),
    interpretation: row.interpretation as InterpretationPayload,
    promptVersion: String(row.prompt_version),
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function getRolloutBucket(userId: string): number {
  const hash = createHash("sha256").update(userId).digest("hex");
  const slice = hash.slice(0, 8);
  const value = Number.parseInt(slice, 16);
  return value % 100;
}

export function isAiInterpretationsEnabledForUser(userId: string): boolean {
  if (!isFeatureEnabled("aiInterpretations")) {
    return false;
  }

  const canaryUsers = getCanaryUserIds();
  if (canaryUsers.has(userId)) {
    return true;
  }

  return getRolloutBucket(userId) < getAiRolloutPercent();
}

export function assertAiInterpretationsEnabled(userId: string): void {
  if (!isAiInterpretationsEnabledForUser(userId)) {
    throw forbiddenError("AI interpretations are not enabled for this account");
  }
}

export function getInterpretationModel(): string {
  return getEnv().OPENAI_MODEL;
}

export async function getCachedInterpretation(params: {
  chartId: string;
  model: string;
  clerkUserId: string;
}): Promise<InterpretationRecord | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chart_interpretations")
    .select(
      "id, chart_id, clerk_user_id, model, interpretation, prompt_version, metadata, created_at, updated_at, deleted_at",
    )
    .eq("chart_id", params.chartId)
    .eq("clerk_user_id", params.clerkUserId)
    .eq("model", params.model)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(
    error,
    "interpretation_fetch_failed",
    "Failed to fetch cached interpretation",
  );

  if (!data) {
    return null;
  }

  return mapInterpretationRow(data as Record<string, unknown>);
}

export async function saveInterpretation(params: {
  chartId: string;
  clerkUserId: string;
  model: string;
  interpretation: InterpretationPayload;
  promptVersion: string;
  metadata: Record<string, unknown>;
}): Promise<InterpretationRecord> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chart_interpretations")
    .upsert(
      {
        chart_id: params.chartId,
        clerk_user_id: params.clerkUserId,
        model: params.model,
        interpretation: params.interpretation,
        prompt_version: params.promptVersion,
        metadata: params.metadata,
        deleted_at: null,
      },
      {
        onConflict: "chart_id,model",
      },
    )
    .select(
      "id, chart_id, clerk_user_id, model, interpretation, prompt_version, metadata, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(error, "interpretation_save_failed", "Failed to store interpretation");

  return mapInterpretationRow(data as Record<string, unknown>);
}

export async function softDeleteInterpretationsForUser(clerkUserId: string): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("chart_interpretations")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null);

  throwIfSupabaseError(
    error,
    "interpretation_delete_failed",
    "Failed to delete interpretations",
  );
}
