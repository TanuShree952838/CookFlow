import { describe, expect, it } from "vitest";
import { computeFeasibility, round2 } from "@/lib/budget/computeFeasibility";
import { normalizePlan } from "@/lib/plan/normalize";
import { makeContext, makeRawPlan } from "./fixtures";

describe("round2", () => {
  it("rounds to two decimals without float drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(280.005)).toBe(280.01);
  });
});

describe("computeFeasibility", () => {
  const grocery = makeRawPlan().grocery; // sums to 280

  it("computes total from grocery, ignoring the AI's claimed total", () => {
    const result = computeFeasibility(
      grocery,
      { status: "within_budget", estimatedTotal: 9999, explanation: "x" },
      600,
      "INR",
    );
    expect(result.estimatedTotal).toBe(280);
    expect(result.remaining).toBe(320);
    expect(result.status).toBe("within_budget");
  });

  it("flags over_budget when the real total exceeds the limit", () => {
    const result = computeFeasibility(
      grocery,
      { status: "within_budget", estimatedTotal: 100, explanation: "x" },
      200,
      "INR",
    );
    expect(result.status).toBe("over_budget");
    expect(result.remaining).toBe(-80);
  });

  it("preserves revised_to_fit when the plan genuinely fits", () => {
    const result = computeFeasibility(
      grocery,
      { status: "revised_to_fit", estimatedTotal: 280, explanation: "x" },
      600,
      "INR",
    );
    expect(result.status).toBe("revised_to_fit");
  });
});

describe("normalizePlan", () => {
  it("assigns deterministic ids and sorts tasks by time", () => {
    const raw = makeRawPlan({
      tasks: [
        { time: "19:30", title: "Dinner", durationMinutes: 30, meal: "dinner" },
        { time: "07:30", title: "Breakfast", durationMinutes: 20, meal: "breakfast" },
      ],
    });
    const plan = normalizePlan(raw, makeContext());
    expect(plan.tasks[0]?.time).toBe("07:30");
    expect(plan.tasks[0]?.id).toBe("task-0");
    expect(plan.meals[0]?.id).toBe("meal-breakfast");
    expect(plan.grocery[0]?.id).toBe("grocery-0");
  });

  it("uses the server-computed budget, not the AI's", () => {
    const raw = makeRawPlan({
      budget: { status: "within_budget", estimatedTotal: 5, explanation: "wrong" },
    });
    const plan = normalizePlan(raw, makeContext({ budget: 600 }));
    expect(plan.budget.estimatedTotal).toBe(280);
    expect(plan.budget.budgetLimit).toBe(600);
  });
});
