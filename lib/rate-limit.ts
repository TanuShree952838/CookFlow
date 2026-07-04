/**
 * Minimal in-memory fixed-window rate limiter, keyed by client identifier
 * (typically IP). It protects the Gemini quota and the endpoint from abuse.
 *
 * Scope note: state lives in a single server instance's memory, so limits are
 * per-instance. That is sufficient for a hackathon/demo deployment; a
 * multi-region production system would back this with Redis or Upstash. The
 * interface is intentionally storage-agnostic so that swap is trivial.
 */

interface WindowState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowState>();

function config() {
  const max = Number(process.env.RATE_LIMIT_MAX ?? 10);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  return {
    max: Number.isFinite(max) && max > 0 ? max : 10,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const { max, windowMs } = config();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneExpired(now);
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: max - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Prevents unbounded map growth from one-off keys. */
function pruneExpired(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, state] of buckets) {
    if (state.resetAt <= now) buckets.delete(key);
  }
}

/** Test helper to reset limiter state between cases. */
export function __resetRateLimiter(): void {
  buckets.clear();
}
