import { createHash } from "node:crypto";
import type { DayContext, MealPlan } from "@/lib/types";

/**
 * Tiny in-memory TTL + LRU cache for generated plans, keyed by a hash of the
 * normalized input. Identical requests (e.g. a user regenerating without
 * changing anything, or a demo run twice) return instantly without spending an
 * API call. State is per-instance and best-effort — a cache miss simply calls
 * Gemini again, so correctness never depends on it.
 */

const MAX_ENTRIES = 50;
const TTL_MS = 10 * 60 * 1000;

interface Entry {
  plan: MealPlan;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/** Deterministic key from the semantically-relevant input fields. */
export function hashContext(context: DayContext): string {
  const canonical = JSON.stringify({
    wakeTime: context.wakeTime,
    dinnerTime: context.dinnerTime,
    scheduleNote: context.scheduleNote,
    includeMeals: [...context.includeMeals].sort(),
    servings: context.servings,
    budget: context.budget,
    currency: context.currency,
    dietary: [...context.dietary].sort(),
    avoid: context.avoid,
    pantry: context.pantry,
    skill: context.skill,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function getCachedPlan(key: string): MealPlan | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  // Refresh recency for LRU ordering.
  store.delete(key);
  store.set(key, entry);
  return entry.plan;
}

export function setCachedPlan(key: string, plan: MealPlan): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { plan, expiresAt: Date.now() + TTL_MS });
}

/** Test helper. */
export function __resetCache(): void {
  store.clear();
}
