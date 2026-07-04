import { z } from "zod";
import {
  CURRENCIES,
  DIETARY_TAGS,
  MEAL_SLOTS,
  SKILL_LEVELS,
} from "@/lib/types";

/**
 * Input limits are exported so the UI can enforce the same bounds (maxLength,
 * min/max) that the server does, keeping client and server in lock-step.
 */
export const INPUT_LIMITS = {
  scheduleNote: 500,
  avoid: 300,
  pantry: 500,
  servingsMin: 1,
  servingsMax: 12,
  budgetMin: 1,
  budgetMax: 100_000,
  dietaryMax: DIETARY_TAGS.length,
} as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeField = (label: string) =>
  z
    .string()
    .trim()
    .regex(TIME_PATTERN, `${label} must be a valid 24-hour time (HH:MM)`);

export const dayContextSchema = z.object({
  wakeTime: timeField("Wake time"),
  dinnerTime: timeField("Dinner time"),
  scheduleNote: z
    .string()
    .trim()
    .max(INPUT_LIMITS.scheduleNote, "Schedule note is too long")
    .default(""),
  includeMeals: z
    .array(z.enum(MEAL_SLOTS))
    .min(1, "Pick at least one meal")
    .refine(
      (meals) => new Set(meals).size === meals.length,
      "Meals must be unique",
    ),
  servings: z
    .number({ invalid_type_error: "Servings must be a number" })
    .int("Servings must be a whole number")
    .min(INPUT_LIMITS.servingsMin, "At least 1 serving")
    .max(INPUT_LIMITS.servingsMax, `At most ${INPUT_LIMITS.servingsMax} servings`),
  budget: z
    .number({ invalid_type_error: "Budget must be a number" })
    .finite("Budget must be a real number")
    .positive("Budget must be greater than zero")
    .max(INPUT_LIMITS.budgetMax, "Budget is unrealistically high"),
  currency: z.enum(CURRENCIES),
  dietary: z
    .array(z.enum(DIETARY_TAGS))
    .max(INPUT_LIMITS.dietaryMax)
    .refine(
      (tags) => new Set(tags).size === tags.length,
      "Dietary tags must be unique",
    )
    .default([]),
  avoid: z
    .string()
    .trim()
    .max(INPUT_LIMITS.avoid, "Avoid list is too long")
    .default(""),
  pantry: z
    .string()
    .trim()
    .max(INPUT_LIMITS.pantry, "Pantry list is too long")
    .default(""),
  skill: z.enum(SKILL_LEVELS),
});

/** Inferred type is structurally compatible with `DayContext`. */
export type DayContextInput = z.infer<typeof dayContextSchema>;
