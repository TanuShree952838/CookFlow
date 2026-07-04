import type { MealPlan, PlanMeta } from "@/lib/types";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { BudgetFeasibilityCard } from "@/components/results/BudgetFeasibilityCard";
import { MealCard } from "@/components/results/MealCard";
import { TodoTimeline } from "@/components/results/TodoTimeline";
import { GroceryList } from "@/components/results/GroceryList";
import { SubstitutionsPanel } from "@/components/results/SubstitutionsPanel";

export function PlanDashboard({
  plan,
  meta,
  onCopied,
}: {
  plan: MealPlan;
  meta: PlanMeta | null;
  onCopied?: (message: string) => void;
}) {
  const currency = plan.budget.currency;

  const tabs: TabItem[] = [
    {
      id: "meals",
      label: "Meals",
      badge: plan.meals.length,
      content: (
        <div className="flex flex-col gap-4">
          {plan.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} currency={currency} />
          ))}
        </div>
      ),
    },
    {
      id: "todo",
      label: "To-Do",
      badge: plan.tasks.length,
      content: <TodoTimeline tasks={plan.tasks} />,
    },
    {
      id: "grocery",
      label: "Grocery",
      badge: plan.grocery.length,
      content: <GroceryList items={plan.grocery} currency={currency} onCopied={onCopied} />,
    },
    {
      id: "swaps",
      label: "Swaps",
      badge: plan.substitutions.length,
      content: <SubstitutionsPanel substitutions={plan.substitutions} currency={currency} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text">Your plan for the day</h2>
          {meta?.cached && <Badge tone="neutral">Cached</Badge>}
        </div>
        <p className="mt-2 text-sm text-text/80">{plan.summary}</p>
      </div>

      <BudgetFeasibilityCard budget={plan.budget} />

      <Tabs items={tabs} ariaLabel="Plan sections" />
    </div>
  );
}
