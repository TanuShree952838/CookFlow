"use client";

import { useMemo, useState } from "react";
import {
  GROCERY_CATEGORIES,
  type Currency,
  type GroceryItem,
} from "@/lib/types";
import { CATEGORY_LABELS, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";

/**
 * Grocery list grouped by aisle/category with a total and a copy-to-clipboard
 * action. Copy state is announced via a polite live region.
 */
export function GroceryList({
  items,
  currency,
  onCopied,
}: {
  items: GroceryItem[];
  currency: Currency;
  onCopied?: (message: string) => void;
}) {
  const [copyError, setCopyError] = useState(false);

  const grouped = useMemo(() => {
    return GROCERY_CATEGORIES.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [items]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.estimatedCost, 0),
    [items],
  );

  const buildText = () => {
    const lines = grouped.flatMap((group) => [
      `# ${CATEGORY_LABELS[group.category]}`,
      ...group.items.map(
        (item) =>
          `- ${item.name} (${item.quantity}) — ${formatMoney(item.estimatedCost, currency)}`,
      ),
      "",
    ]);
    lines.push(`Total: ${formatMoney(total, currency)}`);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopyError(false);
      onCopied?.("Grocery list copied to clipboard");
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          {items.length} items ·{" "}
          <span className="text-muted">{formatMoney(total, currency)}</span>
        </p>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          Copy list
        </Button>
      </div>

      {copyError && (
        <p role="alert" className="mb-3 text-xs text-danger">
          Couldn&apos;t copy automatically. Please select and copy manually.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {grouped.map((group) => (
          <section key={group.category} aria-label={CATEGORY_LABELS[group.category]}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {CATEGORY_LABELS[group.category]}
            </h3>
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-text">
                    {item.name}
                    <span className="ml-2 text-xs text-muted">{item.quantity}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">
                    {formatMoney(item.estimatedCost, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
