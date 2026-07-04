import { z } from "zod";
import {
  BUDGET_STATUSES,
  GROCERY_CATEGORIES,
  MEAL_SLOTS,
} from "@/lib/types";

/**
 * Schema for the raw AI payload. This is the trust boundary between an
 * unpredictable language model and the rest of the app: anything that does not
 * match this shape is rejected before it can reach the UI or budget engine.
 *
 * Numbers are clamped to non-negative to defend against nonsensical costs, and
 * strings are length-capped so a runaway generation cannot bloat the response.
 */

const shortText = z.string().trim().min(1).max(200);
const longText = z.string().trim().min(1).max(600);
const cost = z.number().nonnegative().finite();

const rawMealSchema = z.object({
  slot: z.enum(MEAL_SLOTS),
  title: shortText,
  summary: longText,
  steps: z.array(shortText.max(300)).min(1).max(12),
  prepMinutes: z.number().int().nonnegative().max(600),
  estimatedCost: cost,
});

const rawTaskSchema = z.object({
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "task.time must be HH:MM"),
  title: shortText,
  durationMinutes: z.number().int().nonnegative().max(600),
  meal: z.enum(MEAL_SLOTS),
});

const rawGrocerySchema = z.object({
  name: shortText,
  quantity: shortText,
  category: z.enum(GROCERY_CATEGORIES),
  estimatedCost: cost,
});

const rawSubstitutionSchema = z.object({
  original: shortText,
  replacement: shortText,
  reason: longText,
  // The model sometimes omits savings; default keeps the shape stable.
  savesAmount: z.number().finite().default(0),
});

const rawBudgetSchema = z.object({
  status: z.enum(BUDGET_STATUSES),
  estimatedTotal: cost,
  explanation: longText,
});

export const rawMealPlanSchema = z.object({
  summary: longText,
  meals: z.array(rawMealSchema).min(1).max(3),
  tasks: z.array(rawTaskSchema).min(1).max(30),
  grocery: z.array(rawGrocerySchema).min(1).max(60),
  substitutions: z.array(rawSubstitutionSchema).max(20).default([]),
  budget: rawBudgetSchema,
});

export type RawMealPlanParsed = z.infer<typeof rawMealPlanSchema>;
