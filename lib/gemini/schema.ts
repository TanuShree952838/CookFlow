import { SchemaType, type Schema } from "@google/generative-ai";
import {
  BUDGET_STATUSES,
  GROCERY_CATEGORIES,
  MEAL_SLOTS,
} from "@/lib/types";

/**
 * Gemini native response schema. Passing this as `responseSchema` forces the
 * model to emit JSON in this exact shape, which dramatically reduces parse and
 * validation failures compared to prompt-only instructions. Zod still validates
 * afterwards as a second guard (the model can occasionally violate the schema).
 */
export const geminiResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    meals: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          slot: { type: SchemaType.STRING, format: "enum", enum: [...MEAL_SLOTS] },
          title: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          prepMinutes: { type: SchemaType.INTEGER },
          estimatedCost: { type: SchemaType.NUMBER },
        },
        required: ["slot", "title", "summary", "steps", "prepMinutes", "estimatedCost"],
      },
    },
    tasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          time: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          durationMinutes: { type: SchemaType.INTEGER },
          meal: { type: SchemaType.STRING, format: "enum", enum: [...MEAL_SLOTS] },
        },
        required: ["time", "title", "durationMinutes", "meal"],
      },
    },
    grocery: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.STRING },
          category: {
            type: SchemaType.STRING,
            format: "enum",
            enum: [...GROCERY_CATEGORIES],
          },
          estimatedCost: { type: SchemaType.NUMBER },
        },
        required: ["name", "quantity", "category", "estimatedCost"],
      },
    },
    substitutions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          original: { type: SchemaType.STRING },
          replacement: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          savesAmount: { type: SchemaType.NUMBER },
        },
        required: ["original", "replacement", "reason"],
      },
    },
    budget: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          format: "enum",
          enum: [...BUDGET_STATUSES],
        },
        estimatedTotal: { type: SchemaType.NUMBER },
        explanation: { type: SchemaType.STRING },
      },
      required: ["status", "estimatedTotal", "explanation"],
    },
  },
  required: ["summary", "meals", "tasks", "grocery", "substitutions", "budget"],
};
