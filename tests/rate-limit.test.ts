import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, __resetRateLimiter } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimiter();
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    expect(checkRateLimit("ip-a").allowed).toBe(true);
    expect(checkRateLimit("ip-a").allowed).toBe(true);
    expect(checkRateLimit("ip-a").allowed).toBe(true);
  });

  it("blocks once the limit is exceeded", () => {
    checkRateLimit("ip-b");
    checkRateLimit("ip-b");
    checkRateLimit("ip-b");
    const blocked = checkRateLimit("ip-b");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    checkRateLimit("ip-c");
    checkRateLimit("ip-c");
    checkRateLimit("ip-c");
    expect(checkRateLimit("ip-c").allowed).toBe(false);
    expect(checkRateLimit("ip-d").allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    checkRateLimit("ip-e");
    checkRateLimit("ip-e");
    checkRateLimit("ip-e");
    expect(checkRateLimit("ip-e").allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit("ip-e").allowed).toBe(true);
  });
});
