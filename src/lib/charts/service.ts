import { notFoundError } from "@/lib/api/errors";
import type { CalculateRequest } from "@/lib/validation/calculate";
import type { CalculateResponse } from "@/lib/astrology/types";
import { createSupabaseServerClient } from "@/lib/clients/supabase";
import type { ChartRecord, ChartSummary, PaginatedCharts } from "@/lib/charts/types";
import { throwIfSupabaseError } from "@/lib/db/errors";

function mapChartRow(row: Record<string, unknown>): ChartRecord {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    birthInput: row.birth_input as CalculateRequest,
    calculationResult: row.calculation_result as CalculateResponse,
    comparisonTraits: (row.comparison_traits as Record<string, unknown> | null) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

function mapSummary(row: Record<string, unknown>): ChartSummary {
  const birthInput = row.birth_input as Record<string, unknown>;

  return {
    id: String(row.id),
    fullName: String(birthInput.fullName ?? "Unknown"),
    dateOfBirth: String(birthInput.dateOfBirth ?? ""),
    timezone: String(birthInput.timezone ?? ""),
    createdAt: String(row.created_at),
  };
}

export async function saveChartRecord(params: {
  clerkUserId: string;
  birthInput: CalculateRequest;
  calculationResult: CalculateResponse;
}): Promise<ChartRecord> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("charts")
    .insert({
      clerk_user_id: params.clerkUserId,
      birth_input: params.birthInput,
      calculation_result: params.calculationResult,
      comparison_traits: {},
    })
    .select(
      "id, clerk_user_id, birth_input, calculation_result, comparison_traits, created_at, updated_at, deleted_at",
    )
    .single();

  throwIfSupabaseError(error, "chart_save_failed", "Failed to save chart record");

  return mapChartRow(data as Record<string, unknown>);
}

export async function listChartsForUser(params: {
  clerkUserId: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedCharts> {
  const supabase = createSupabaseServerClient();
  const from = Math.max(0, (params.page - 1) * params.pageSize);
  const to = from + params.pageSize - 1;

  const { data, error, count } = await supabase
    .from("charts")
    .select("id, birth_input, created_at", { count: "exact" })
    .eq("clerk_user_id", params.clerkUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  throwIfSupabaseError(error, "chart_list_failed", "Failed to list saved charts");

  const items = ((data ?? []) as Record<string, unknown>[]).map(mapSummary);

  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total: count ?? items.length,
  };
}

export async function getChartByIdForUser(params: {
  clerkUserId: string;
  chartId: string;
}): Promise<ChartRecord> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("charts")
    .select(
      "id, clerk_user_id, birth_input, calculation_result, comparison_traits, created_at, updated_at, deleted_at",
    )
    .eq("id", params.chartId)
    .eq("clerk_user_id", params.clerkUserId)
    .is("deleted_at", null)
    .maybeSingle();

  throwIfSupabaseError(error, "chart_fetch_failed", "Failed to fetch chart record");

  if (!data) {
    throw notFoundError("Chart not found");
  }

  return mapChartRow(data as Record<string, unknown>);
}

export async function softDeleteChartForUser(params: {
  clerkUserId: string;
  chartId: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("charts")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", params.chartId)
    .eq("clerk_user_id", params.clerkUserId)
    .is("deleted_at", null);

  throwIfSupabaseError(error, "chart_delete_failed", "Failed to delete chart");
}

export async function softDeleteChartsForUser(clerkUserId: string): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("charts")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null);

  throwIfSupabaseError(error, "chart_delete_failed", "Failed to delete charts");
}
