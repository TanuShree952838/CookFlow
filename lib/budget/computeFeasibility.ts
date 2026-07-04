import type {
  BudgetFeasibility,
  Currency,
  RawBudget,
  RawGroceryItem,
} from "@/lib/types";

/** Rounds to 2 decimal places, avoiding binary float drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Recomputes budget feasibility from the ground truth: the sum of grocery item
 * costs. The AI's own arithmetic is never trusted — only its qualitative
 * intent (e.g. that it revised the plan) is preserved when consistent with the
 * recomputed totals.
 */
export function computeFeasibility(
  grocery: RawGroceryItem[],
  aiBudget: RawBudget,
  budgetLimit: number,
  currency: Currency,
): BudgetFeasibility {
  const estimatedTotal = round2(
    grocery.reduce((sum, item) => sum + item.estimatedCost, 0),
  );
  const remaining = round2(budgetLimit - estimatedTotal);
  const fits = estimatedTotal <= budgetLimit;

  let status: BudgetFeasibility["status"];
  if (fits) {
    // Preserve the model's claim that it actively revised to fit; otherwise the
    // plan simply fits as-is.
    status = aiBudget.status === "revised_to_fit" ? "revised_to_fit" : "within_budget";
  } else {
    status = "over_budget";
  }

  return {
    status,
    estimatedTotal,
    budgetLimit: round2(budgetLimit),
    remaining,
    currency,
    explanation: aiBudget.explanation,
  };
}
