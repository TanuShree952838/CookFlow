import { beforeEach, describe, expect, it } from "vitest";
import {
  getCachedPlan,
  hashContext,
  setCachedPlan,
  __resetCache,
} from "@/lib/cache";
import { normalizePlan } from "@/lib/plan/normalize";
import { makeContext, makeRawPlan } from "./fixtures";

describe("hashContext", () => {
  it("is deterministic regardless of array order", () => {
    const a = hashContext(makeContext({ includeMeals: ["breakfast", "lunch"], dietary: ["vegan", "nut-free"] }));
    const b = hashContext(makeContext({ includeMeals: ["lunch", "breakfast"], dietary: ["nut-free", "vegan"] }));
    expect(a).toBe(b);
  });

  it("differs when meaningful input changes", () => {
    const a = hashContext(makeContext({ budget: 500 }));
    const b = hashContext(makeContext({ budget: 900 }));
    expect(a).not.toBe(b);
  });
});

describe("plan cache", () => {
  beforeEach(() => __resetCache());

  it("stores and retrieves a plan by key", () => {
    const plan = normalizePlan(makeRawPlan(), makeContext());
    const key = hashContext(makeContext());
    expect(getCachedPlan(key)).toBeNull();
    setCachedPlan(key, plan);
    expect(getCachedPlan(key)).toEqual(plan);
  });

  it("returns null for unknown keys", () => {
    expect(getCachedPlan("does-not-exist")).toBeNull();
  });
});
