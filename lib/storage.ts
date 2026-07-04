import type { MealPlan } from "@/lib/types";

/**
 * Thin, SSR-safe wrapper around localStorage. Every access is guarded so the
 * app degrades gracefully when storage is unavailable (SSR, private browsing,
 * quota exceeded) — persistence is a convenience, never a correctness
 * dependency.
 */

const PLAN_KEY = "cookflow:plan:v1";
const DRAFT_KEY = "cookflow:draft:v1";

export interface StoredPlan {
  plan: MealPlan;
  savedAt: number;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJSON<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization errors — persistence is best-effort.
  }
}

function remove(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export function savePlan(plan: MealPlan): void {
  writeJSON(PLAN_KEY, { plan, savedAt: Date.now() } satisfies StoredPlan);
}

export function loadPlan(): StoredPlan | null {
  return readJSON<StoredPlan>(PLAN_KEY);
}

export function clearPlan(): void {
  remove(PLAN_KEY);
}

/** Draft is stored as the raw form shape (strings for numeric fields). */
export function saveDraft<T extends object>(draft: T): void {
  writeJSON(DRAFT_KEY, draft);
}

export function loadDraft<T extends object>(): Partial<T> | null {
  return readJSON<Partial<T>>(DRAFT_KEY);
}
