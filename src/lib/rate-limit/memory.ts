interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

type BucketMap = Map<string, number[]>;

const buckets: Record<string, BucketMap> = {
  billing: new Map(),
  interpretation: new Map(),
};

function prune(entries: number[], now: number, windowMs: number): number[] {
  return entries.filter((value) => now - value < windowMs);
}

export function checkRateLimit(
  bucket: keyof typeof buckets,
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const store = buckets[bucket];
  const current = prune(store.get(key) ?? [], now, config.windowMs);

  if (current.length >= config.limit) {
    const oldest = current[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((config.windowMs - (now - oldest)) / 1000),
    );

    store.set(key, current);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  current.push(now);
  store.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - current.length),
    retryAfterSeconds: 0,
  };
}
