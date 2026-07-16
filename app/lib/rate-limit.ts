type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const buckets = new Map<string, RateLimitBucket>();
let checksSinceCleanup = 0;

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("cf-connecting-ip")?.trim()
    || "unknown";
}

export function checkRateLimit(
  key: string,
  options: { limit?: number; windowMs?: number; now?: number } = {}
): RateLimitResult {
  const limit = options.limit ?? 20;
  const windowMs = options.windowMs ?? 60_000;
  const now = options.now ?? Date.now();

  checksSinceCleanup += 1;
  if (checksSinceCleanup >= 100) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    checksSinceCleanup = 0;
  }

  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, limit - bucket.count);
  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  };
}

export function resetRateLimits() {
  buckets.clear();
  checksSinceCleanup = 0;
}
