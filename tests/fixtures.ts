import type { DayContext } from "@/lib/types";
import type { RawMealPlanParsed } from "@/lib/validation/output";

export function makeContext(overrides: Partial<DayContext> = {}): DayContext {
  return {
    wakeTime: "07:00",
    dinnerTime: "20:00",
    scheduleNote: "Busy work day",
    includeMeals: ["breakfast", "lunch", "dinner"],
    servings: 2,
    budget: 600,
    currency: "INR",
    dietary: ["vegetarian"],
    avoid: "",
    pantry: "rice, salt",
    skill: "beginner",
    ...overrides,
  };
}

export function makeRawPlan(overrides: Partial<RawMealPlanParsed> = {}): RawMealPlanParsed {
  return {
    summary: "A simple vegetarian day that fits your budget.",
    meals: [
      {
        slot: "breakfast",
        title: "Veg Poha",
        summary: "Light flattened-rice breakfast.",
        steps: ["Rinse poha", "Temper spices", "Mix and serve"],
        prepMinutes: 20,
        estimatedCost: 60,
      },
      {
        slot: "lunch",
        title: "Rajma Rice",
        summary: "Protein-rich kidney beans with rice.",
        steps: ["Cook rajma", "Prepare gravy", "Serve with rice"],
        prepMinutes: 45,
        estimatedCost: 140,
      },
      {
        slot: "dinner",
        title: "Veg Pulao",
        summary: "One-pot spiced rice with vegetables.",
        steps: ["Saute veggies", "Add rice and water", "Cook and serve"],
        prepMinutes: 35,
        estimatedCost: 120,
      },
    ],
    tasks: [
      { time: "07:30", title: "Cook poha", durationMinutes: 20, meal: "breakfast" },
      { time: "12:30", title: "Cook rajma rice", durationMinutes: 45, meal: "lunch" },
      { time: "19:30", title: "Cook veg pulao", durationMinutes: 35, meal: "dinner" },
    ],
    grocery: [
      { name: "Poha", quantity: "200g", category: "grains", estimatedCost: 40 },
      { name: "Kidney beans", quantity: "250g", category: "protein", estimatedCost: 90 },
      { name: "Mixed vegetables", quantity: "500g", category: "produce", estimatedCost: 120 },
      { name: "Onions", quantity: "3", category: "produce", estimatedCost: 30 },
    ],
    substitutions: [
      {
        original: "Paneer",
        replacement: "Tofu",
        reason: "Cheaper and dairy-free.",
        savesAmount: 40,
      },
    ],
    budget: {
      status: "within_budget",
      estimatedTotal: 280,
      explanation: "All meals fit comfortably within your budget.",
    },
    ...overrides,
  };
}
