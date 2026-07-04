import type { DayContext, MealPlan } from "@/lib/types";
import type { RawMealPlanParsed } from "@/lib/validation/output";
import { computeFeasibility, round2 } from "@/lib/budget/computeFeasibility";

/**
 * Converts a validated raw AI plan into the UI-facing `MealPlan`:
 *   - assigns stable, deterministic IDs (safe React keys, testable output),
 *   - rounds all monetary values,
 *   - sorts cooking tasks chronologically,
 *   - replaces AI budget arithmetic with server-computed figures.
 *
 * IDs are generated here (not by the model) so they are guaranteed unique.
 */
export function normalizePlan(
  raw: RawMealPlanParsed,
  context: DayContext,
): MealPlan {
  const meals = raw.meals.map((meal) => ({
    ...meal,
    id: `meal-${meal.slot}`,
    estimatedCost: round2(meal.estimatedCost),
  }));

  const tasks = [...raw.tasks]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((task, index) => ({ ...task, id: `task-${index}` }));

  const grocery = raw.grocery.map((item, index) => ({
    ...item,
    id: `grocery-${index}`,
    estimatedCost: round2(item.estimatedCost),
  }));

  const substitutions = raw.substitutions.map((sub, index) => ({
    ...sub,
    id: `sub-${index}`,
    savesAmount: round2(sub.savesAmount),
  }));

  const budget = computeFeasibility(
    raw.grocery,
    raw.budget,
    context.budget,
    context.currency,
  );

  return { summary: raw.summary, meals, tasks, grocery, substitutions, budget };
}
