import type { CalculateRequest } from "@/lib/validation/calculate";
import type { CalculateResponse } from "@/lib/astrology/types";

export interface ChartRecord {
  id: string;
  clerkUserId: string;
  birthInput: CalculateRequest;
  calculationResult: CalculateResponse;
  comparisonTraits?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ChartSummary {
  id: string;
  fullName: string;
  dateOfBirth: string;
  timezone: string;
  createdAt: string;
}

export interface PaginatedCharts {
  items: ChartSummary[];
  page: number;
  pageSize: number;
  total: number;
}
