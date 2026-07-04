/**
 * Domain types for CookFlow.
 *
 * The data model is deliberately split in two layers:
 *  - `Raw*` types describe exactly what the AI is asked to return. They contain
 *    no client-generated IDs so the model has less to hallucinate.
 *  - The UI-facing types (`MealPlan`, `CookingTask`, ...) add stable IDs and
 *    server-computed budget figures during normalization.
 */

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "high-protein",
  "low-carb",
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const GROCERY_CATEGORIES = [
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "spices",
  "other",
] as const;
export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export const BUDGET_STATUSES = [
  "within_budget",
  "over_budget",
  "revised_to_fit",
] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/** Validated user input describing the day to plan for. */
export interface DayContext {
  wakeTime: string;
  dinnerTime: string;
  scheduleNote: string;
  includeMeals: MealSlot[];
  servings: number;
  budget: number;
  currency: Currency;
  dietary: DietaryTag[];
  avoid: string;
  pantry: string;
  skill: SkillLevel;
}

/* ------------------------------------------------------------------ *
 * Raw AI payload (no IDs, no trusted math).                           *
 * ------------------------------------------------------------------ */

export interface RawMeal {
  slot: MealSlot;
  title: string;
  summary: string;
  steps: string[];
  prepMinutes: number;
  estimatedCost: number;
}

export interface RawCookingTask {
  time: string;
  title: string;
  durationMinutes: number;
  meal: MealSlot;
}

export interface RawGroceryItem {
  name: string;
  quantity: string;
  category: GroceryCategory;
  estimatedCost: number;
}

export interface RawSubstitution {
  original: string;
  replacement: string;
  reason: string;
  savesAmount: number;
}

export interface RawBudget {
  status: BudgetStatus;
  estimatedTotal: number;
  explanation: string;
}

export interface RawMealPlan {
  summary: string;
  meals: RawMeal[];
  tasks: RawCookingTask[];
  grocery: RawGroceryItem[];
  substitutions: RawSubstitution[];
  budget: RawBudget;
}

/* ------------------------------------------------------------------ *
 * Normalized, UI-facing plan (IDs added, budget recomputed).          *
 * ------------------------------------------------------------------ */

export interface Meal extends RawMeal {
  id: string;
}

export interface CookingTask extends RawCookingTask {
  id: string;
}

export interface GroceryItem extends RawGroceryItem {
  id: string;
}

export interface Substitution extends RawSubstitution {
  id: string;
}

/** Budget figures are authoritative: recomputed on the server from grocery. */
export interface BudgetFeasibility {
  status: BudgetStatus;
  estimatedTotal: number;
  budgetLimit: number;
  remaining: number;
  currency: Currency;
  explanation: string;
}

export interface MealPlan {
  summary: string;
  meals: Meal[];
  tasks: CookingTask[];
  grocery: GroceryItem[];
  substitutions: Substitution[];
  budget: BudgetFeasibility;
}

export interface PlanMeta {
  model: string;
  latencyMs: number;
  cached: boolean;
  revised: boolean;
}

/** Success envelope returned by POST /api/generate-plan. */
export interface GeneratePlanResponse {
  plan: MealPlan;
  meta: PlanMeta;
}

/** Error envelope returned by POST /api/generate-plan. */
export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  details?: unknown;
}

export type ApiErrorCode =
  | "invalid_json"
  | "validation_failed"
  | "rate_limited"
  | "timeout"
  | "empty_response"
  | "invalid_ai_output"
  | "upstream_error"
  | "misconfigured";
