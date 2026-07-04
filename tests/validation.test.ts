import { describe, expect, it } from "vitest";
import { dayContextSchema } from "@/lib/validation/input";
import { rawMealPlanSchema } from "@/lib/validation/output";
import { makeContext, makeRawPlan } from "./fixtures";

describe("dayContextSchema (input)", () => {
  it("accepts a valid context and applies defaults", () => {
    const result = dayContextSchema.safeParse({
      wakeTime: "07:00",
      dinnerTime: "20:00",
      includeMeals: ["breakfast"],
      servings: 2,
      budget: 500,
      currency: "INR",
      skill: "beginner",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dietary).toEqual([]);
      expect(result.data.avoid).toBe("");
      expect(result.data.scheduleNote).toBe("");
    }
  });

  it("rejects invalid time formats", () => {
    const result = dayContextSchema.safeParse({
      wakeTime: "7am",
      dinnerTime: "20:00",
      includeMeals: ["breakfast"],
      servings: 2,
      budget: 500,
      currency: "INR",
      skill: "beginner",
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one meal", () => {
    const result = dayContextSchema.safeParse({
      ...makeContext(),
      includeMeals: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate meals", () => {
    const result = dayContextSchema.safeParse({
      ...makeContext(),
      includeMeals: ["lunch", "lunch"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative budget", () => {
    expect(dayContextSchema.safeParse({ ...makeContext(), budget: 0 }).success).toBe(false);
    expect(dayContextSchema.safeParse({ ...makeContext(), budget: -10 }).success).toBe(false);
  });

  it("rejects non-integer and out-of-range servings", () => {
    expect(dayContextSchema.safeParse({ ...makeContext(), servings: 2.5 }).success).toBe(false);
    expect(dayContextSchema.safeParse({ ...makeContext(), servings: 0 }).success).toBe(false);
    expect(dayContextSchema.safeParse({ ...makeContext(), servings: 99 }).success).toBe(false);
  });

  it("rejects an unknown currency", () => {
    expect(dayContextSchema.safeParse({ ...makeContext(), currency: "JPY" }).success).toBe(false);
  });

  it("rejects overly long free text", () => {
    const result = dayContextSchema.safeParse({
      ...makeContext(),
      avoid: "x".repeat(1000),
    });
    expect(result.success).toBe(false);
  });
});

describe("rawMealPlanSchema (AI output)", () => {
  it("accepts a well-formed plan", () => {
    expect(rawMealPlanSchema.safeParse(makeRawPlan()).success).toBe(true);
  });

  it("defaults substitutions to an empty array", () => {
    const plan = makeRawPlan();
    const withoutSubs = { ...plan, substitutions: undefined };
    const result = rawMealPlanSchema.safeParse(withoutSubs);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.substitutions).toEqual([]);
  });

  it("defaults a missing savesAmount to 0", () => {
    const plan = makeRawPlan({
      substitutions: [
        { original: "A", replacement: "B", reason: "cheaper" } as never,
      ],
    });
    const result = rawMealPlanSchema.safeParse(plan);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.substitutions[0]?.savesAmount).toBe(0);
  });

  it("rejects negative costs", () => {
    const plan = makeRawPlan();
    plan.grocery[0]!.estimatedCost = -5;
    expect(rawMealPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejects an empty meals array", () => {
    expect(rawMealPlanSchema.safeParse(makeRawPlan({ meals: [] })).success).toBe(false);
  });

  it("rejects an invalid meal slot", () => {
    const plan = makeRawPlan();
    (plan.meals[0] as { slot: string }).slot = "brunch";
    expect(rawMealPlanSchema.safeParse(plan).success).toBe(false);
  });

  it("rejects invalid task time format", () => {
    const plan = makeRawPlan();
    plan.tasks[0]!.time = "7:00 AM";
    expect(rawMealPlanSchema.safeParse(plan).success).toBe(false);
  });
});
