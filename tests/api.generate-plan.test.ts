import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Gemini client so tests never hit the network. `vi.hoisted` makes the
// mock fn available inside the hoisted `vi.mock` factory.
const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));
vi.mock("@/lib/gemini/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gemini/client")>(
    "@/lib/gemini/client",
  );
  return { ...actual, generateMealPlan: generateMock };
});

import { POST } from "@/app/api/generate-plan/route";
import { GeminiError } from "@/lib/gemini/client";
import { __resetRateLimiter } from "@/lib/rate-limit";
import { __resetCache } from "@/lib/cache";
import { makeContext, makeRawPlan } from "./fixtures";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/generate-plan", () => {
  beforeEach(() => {
    generateMock.mockReset();
    __resetRateLimiter();
    __resetCache();
    vi.stubEnv("RATE_LIMIT_MAX", "100");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("returns a normalized plan on success", async () => {
    generateMock.mockResolvedValue({ plan: makeRawPlan(), model: "gemini-2.5-flash" });
    const res = await POST(makeRequest(makeContext()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.plan.meals).toHaveLength(3);
    expect(json.plan.budget.estimatedTotal).toBe(280);
    expect(json.meta.cached).toBe(false);
    expect(json.meta.model).toBe("gemini-2.5-flash");
  });

  it("serves the second identical request from cache", async () => {
    generateMock.mockResolvedValue({ plan: makeRawPlan(), model: "gemini-2.5-flash" });
    await POST(makeRequest(makeContext()));
    const res2 = await POST(makeRequest(makeContext()));
    const json = await res2.json();
    expect(json.meta.cached).toBe(true);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-JSON body", async () => {
    const res = await POST(makeRequest("{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid_json");
  });

  it("rejects invalid input", async () => {
    const res = await POST(makeRequest({ ...makeContext(), budget: -5 }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("validation_failed");
  });

  it("enforces the rate limit", async () => {
    vi.stubEnv("RATE_LIMIT_MAX", "1");
    generateMock.mockResolvedValue({ plan: makeRawPlan(), model: "gemini-2.5-flash" });
    await POST(makeRequest(makeContext(), { "x-forwarded-for": "9.9.9.9" }));
    const blocked = await POST(
      makeRequest(makeContext({ budget: 601 }), { "x-forwarded-for": "9.9.9.9" }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it.each([
    ["timeout", 504],
    ["rate_limited", 429],
    ["empty_response", 502],
    ["invalid_ai_output", 502],
    ["upstream_error", 502],
    ["misconfigured", 500],
  ] as const)("maps GeminiError %s to HTTP %d", async (code, status) => {
    generateMock.mockRejectedValue(new GeminiError(code, "boom"));
    const res = await POST(makeRequest(makeContext({ budget: Math.floor(Math.random() * 5000) + 1 })));
    expect(res.status).toBe(status);
    expect((await res.json()).code).toBe(code);
  });
});
