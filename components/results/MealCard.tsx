import type { Currency, Meal } from "@/lib/types";
import { formatDuration, formatMoney, MEAL_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export function MealCard({ meal, currency }: { meal: Meal; currency: Currency }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {MEAL_LABELS[meal.slot]}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold text-text">{meal.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{formatDuration(meal.prepMinutes)}</Badge>
          <Badge tone="accent">{formatMoney(meal.estimatedCost, currency)}</Badge>
        </div>
      </div>

      <p className="mt-2 text-sm text-text/80">{meal.summary}</p>

      <ol className="mt-4 flex flex-col gap-2">
        {meal.steps.map((step, index) => (
          <li key={index} className="flex gap-3 text-sm text-text">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted"
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
