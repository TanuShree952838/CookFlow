import type { BudgetFeasibility } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const STATUS_META: Record<
  BudgetFeasibility["status"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  within_budget: { label: "Within budget", tone: "success" },
  revised_to_fit: { label: "Revised to fit", tone: "warning" },
  over_budget: { label: "Over budget", tone: "danger" },
};

export function BudgetFeasibilityCard({ budget }: { budget: BudgetFeasibility }) {
  const meta = STATUS_META[budget.status];
  const usedRatio =
    budget.budgetLimit > 0
      ? Math.min(budget.estimatedTotal / budget.budgetLimit, 1)
      : 0;
  const percentUsed = Math.round(usedRatio * 100);
  const over = budget.status === "over_budget";

  return (
    <section
      aria-labelledby="budget-heading"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="budget-heading" className="text-sm font-semibold text-text">
          Budget feasibility
        </h2>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-text">
            {formatMoney(budget.estimatedTotal, budget.currency)}
          </p>
          <p className="text-xs text-muted">
            of {formatMoney(budget.budgetLimit, budget.currency)} budget
          </p>
        </div>
        <p className={cn("text-sm font-medium", over ? "text-danger" : "text-success")}>
          {over
            ? `${formatMoney(Math.abs(budget.remaining), budget.currency)} over`
            : `${formatMoney(budget.remaining, budget.currency)} left`}
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={percentUsed}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget used"
      >
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-danger" : "bg-success")}
          style={{ width: `${Math.max(percentUsed, 2)}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-text/80">{budget.explanation}</p>
    </section>
  );
}
