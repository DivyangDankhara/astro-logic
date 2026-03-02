import { z } from "zod";

import { ApiRouteError } from "@/lib/api/errors";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  FEATURE_PAYWALL: z.string().optional().default("true"),
  FEATURE_CHART_HISTORY: z.string().optional().default("true"),
  FEATURE_AI_INTERPRETATIONS: z.string().optional().default("false"),
  FEATURE_AI_ROLLOUT_PERCENT: z.string().optional().default("0"),
  INTERNAL_CANARY_USER_IDS: z.string().optional().default(""),

  FREE_CHART_QUOTA: z.string().optional().default("3"),
  AI_INTERPRETATION_RATE_LIMIT_PER_MINUTE: z.string().optional().default("10"),
  BILLING_RATE_LIMIT_PER_MINUTE: z.string().optional().default("30"),
  SOFT_DELETE_RETENTION_DAYS: z.string().optional().default("30"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

function parseBooleanFlag(value: string): boolean {
  return value.toLowerCase() === "true";
}

export function getEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isFeatureEnabled(
  feature: "paywall" | "chartHistory" | "aiInterpretations",
): boolean {
  const env = getEnv();

  if (feature === "paywall") {
    return parseBooleanFlag(env.FEATURE_PAYWALL);
  }

  if (feature === "chartHistory") {
    return parseBooleanFlag(env.FEATURE_CHART_HISTORY);
  }

  return parseBooleanFlag(env.FEATURE_AI_INTERPRETATIONS);
}

export function getFreeChartQuota(): number {
  const env = getEnv();
  const value = Number(env.FREE_CHART_QUOTA);

  if (!Number.isFinite(value) || value < 0) {
    return 3;
  }

  return Math.floor(value);
}

export function getAiRolloutPercent(): number {
  const env = getEnv();
  const value = Number(env.FEATURE_AI_ROLLOUT_PERCENT);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor(value)));
}

export function getBillingRateLimitPerMinute(): number {
  const env = getEnv();
  const value = Number(env.BILLING_RATE_LIMIT_PER_MINUTE);

  if (!Number.isFinite(value) || value <= 0) {
    return 30;
  }

  return Math.floor(value);
}

export function getInterpretationRateLimitPerMinute(): number {
  const env = getEnv();
  const value = Number(env.AI_INTERPRETATION_RATE_LIMIT_PER_MINUTE);

  if (!Number.isFinite(value) || value <= 0) {
    return 10;
  }

  return Math.floor(value);
}

export function getSoftDeleteRetentionDays(): number {
  const env = getEnv();
  const value = Number(env.SOFT_DELETE_RETENTION_DAYS);

  if (!Number.isFinite(value) || value <= 0) {
    return 30;
  }

  return Math.floor(value);
}

export function getCanaryUserIds(): Set<string> {
  const env = getEnv();

  return new Set(
    env.INTERNAL_CANARY_USER_IDS.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function requireEnvValues(
  keys: Array<keyof EnvConfig>,
  context: string,
): void {
  const env = getEnv();
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new ApiRouteError(
      503,
      "missing_env",
      `Missing required environment variables for ${context}`,
      { missing },
    );
  }
}

export function getServerPostHogKey(): string | null {
  const env = getEnv();
  return env.POSTHOG_API_KEY ?? env.POSTHOG_PERSONAL_API_KEY ?? null;
}

export function resetCachedEnvForTests(): void {
  cachedEnv = null;
}
