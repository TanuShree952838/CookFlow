import type { Currency, Substitution } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export function SubstitutionsPanel({
  substitutions,
  currency,
}: {
  substitutions: Substitution[];
  currency: Currency;
}) {
  if (substitutions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
        No substitutions needed — your plan already fits your preferences and budget.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {substitutions.map((sub) => (
        <li key={sub.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-muted line-through">{sub.original}</span>
            <span aria-hidden="true" className="text-accent">
              →
            </span>
            <span className="font-semibold text-text">{sub.replacement}</span>
            {sub.savesAmount > 0 && (
              <Badge tone="success">
                Saves {formatMoney(sub.savesAmount, currency)}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm text-text/80">{sub.reason}</p>
        </li>
      ))}
    </ul>
  );
}
