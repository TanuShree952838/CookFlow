import type {
  Currency,
  DietaryTag,
  GroceryCategory,
  MealSlot,
  SkillLevel,
} from "@/lib/types";

/** Locale-aware currency formatting; Intl provides correct symbols (₹, $, ...). */
export function formatMoney(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: "Produce",
  protein: "Protein",
  dairy: "Dairy",
  grains: "Grains",
  pantry: "Pantry",
  spices: "Spices",
  other: "Other",
};

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  "nut-free": "Nut-free",
  "high-protein": "High-protein",
  "low-carb": "Low-carb",
};

export const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Formats minutes as a compact human duration, e.g. 75 -> "1h 15m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
