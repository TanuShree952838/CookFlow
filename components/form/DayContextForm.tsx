"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURRENCIES,
  DIETARY_TAGS,
  MEAL_SLOTS,
  SKILL_LEVELS,
  type Currency,
  type DayContext,
  type DietaryTag,
  type MealSlot,
  type SkillLevel,
} from "@/lib/types";
import { dayContextSchema, INPUT_LIMITS } from "@/lib/validation/input";
import { DIETARY_LABELS, MEAL_LABELS, SKILL_LABELS } from "@/lib/format";
import { loadDraft, saveDraft } from "@/lib/storage";
import { FormField } from "@/components/form/FormField";
import { CheckboxGroup } from "@/components/form/CheckboxGroup";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface FormValues {
  includeMeals: MealSlot[];
  wakeTime: string;
  dinnerTime: string;
  scheduleNote: string;
  servings: string;
  budget: string;
  currency: Currency;
  dietary: DietaryTag[];
  avoid: string;
  pantry: string;
  skill: SkillLevel;
}

const DEFAULTS: FormValues = {
  includeMeals: [...MEAL_SLOTS],
  wakeTime: "07:00",
  dinnerTime: "20:00",
  scheduleNote: "",
  servings: "2",
  budget: "500",
  currency: "INR",
  dietary: [],
  avoid: "",
  pantry: "",
  skill: "beginner",
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function DayContextForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (context: DayContext) => void;
  isSubmitting: boolean;
}) {
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Restore a saved draft once on mount.
  useEffect(() => {
    const draft = loadDraft<FormValues>();
    if (draft) setValues((prev) => ({ ...prev, ...draft }));
  }, []);

  // Persist draft as the user types (best-effort).
  useEffect(() => {
    saveDraft(values);
  }, [values]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const candidate = {
      ...values,
      servings: Number(values.servings),
      budget: Number(values.budget),
    };
    const result = dayContextSchema.safeParse(candidate);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const next: FieldErrors = {};
      (Object.keys(fieldErrors) as Array<keyof FormValues>).forEach((key) => {
        const messages = fieldErrors[key as keyof typeof fieldErrors];
        if (messages && messages[0]) next[key] = messages[0];
      });
      setErrors(next);
      focusFirstError(next);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const firstKey = Object.keys(fieldErrors)[0];
    if (!firstKey) return;
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"], #${firstKey}`);
      el?.focus();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <CheckboxGroup
        legend="Which meals do you want to plan?"
        name="includeMeals"
        options={MEAL_SLOTS.map((slot) => ({ value: slot, label: MEAL_LABELS[slot] }))}
        selected={values.includeMeals}
        onChange={(next) => set("includeMeals", next)}
        error={errors.includeMeals}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="wakeTime" label="Wake time" required error={errors.wakeTime}>
          <input
            id="wakeTime"
            name="wakeTime"
            type="time"
            value={values.wakeTime}
            onChange={(e) => set("wakeTime", e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField id="dinnerTime" label="Dinner time" required error={errors.dinnerTime}>
          <input
            id="dinnerTime"
            name="dinnerTime"
            type="time"
            value={values.dinnerTime}
            onChange={(e) => set("dinnerTime", e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField
        id="scheduleNote"
        label="What does your day look like?"
        hint="Optional. e.g. back-to-back meetings until 5pm, gym at 6."
        error={errors.scheduleNote}
      >
        <textarea
          id="scheduleNote"
          name="scheduleNote"
          rows={2}
          maxLength={INPUT_LIMITS.scheduleNote}
          value={values.scheduleNote}
          onChange={(e) => set("scheduleNote", e.target.value)}
          placeholder="Busy workday, only 30 minutes free in the evening"
          className={cn(inputClass, "resize-y")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField id="servings" label="Servings" required error={errors.servings}>
          <input
            id="servings"
            name="servings"
            type="number"
            inputMode="numeric"
            min={INPUT_LIMITS.servingsMin}
            max={INPUT_LIMITS.servingsMax}
            value={values.servings}
            onChange={(e) => set("servings", e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField id="budget" label="Daily budget" required error={errors.budget}>
          <input
            id="budget"
            name="budget"
            type="number"
            inputMode="decimal"
            min={INPUT_LIMITS.budgetMin}
            max={INPUT_LIMITS.budgetMax}
            value={values.budget}
            onChange={(e) => set("budget", e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField id="currency" label="Currency" error={errors.currency}>
          <select
            id="currency"
            name="currency"
            value={values.currency}
            onChange={(e) => set("currency", e.target.value as Currency)}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <CheckboxGroup
        legend="Dietary preferences"
        name="dietary"
        options={DIETARY_TAGS.map((tag) => ({ value: tag, label: DIETARY_LABELS[tag] }))}
        selected={values.dietary}
        onChange={(next) => set("dietary", next)}
        error={errors.dietary}
      />

      <FormField
        id="avoid"
        label="Ingredients to avoid"
        hint="Optional. Allergies or dislikes, comma separated."
        error={errors.avoid}
      >
        <input
          id="avoid"
          name="avoid"
          type="text"
          maxLength={INPUT_LIMITS.avoid}
          value={values.avoid}
          onChange={(e) => set("avoid", e.target.value)}
          placeholder="peanuts, mushrooms"
          className={inputClass}
        />
      </FormField>

      <FormField
        id="pantry"
        label="What's already in your pantry?"
        hint="Optional. We'll plan around these to save money."
        error={errors.pantry}
      >
        <textarea
          id="pantry"
          name="pantry"
          rows={2}
          maxLength={INPUT_LIMITS.pantry}
          value={values.pantry}
          onChange={(e) => set("pantry", e.target.value)}
          placeholder="rice, eggs, onions, olive oil"
          className={cn(inputClass, "resize-y")}
        />
      </FormField>

      <FormField id="skill" label="Cooking skill" error={errors.skill}>
        <select
          id="skill"
          name="skill"
          value={values.skill}
          onChange={(e) => set("skill", e.target.value as SkillLevel)}
          className={inputClass}
        >
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {SKILL_LABELS[level]}
            </option>
          ))}
        </select>
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Planning your day…" : "Generate my cooking plan"}
      </Button>
    </form>
  );
}
