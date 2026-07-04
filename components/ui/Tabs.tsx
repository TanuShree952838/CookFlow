"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
  content: ReactNode;
}

/**
 * Accessible tab set following the WAI-ARIA Tabs pattern:
 *   - roving tabindex (only the active tab is in the tab order),
 *   - Arrow/Home/End keyboard navigation with focus + selection,
 *   - correct role/aria-selected/aria-controls wiring.
 */
export function Tabs({ items, ariaLabel }: { items: TabItem[]; ariaLabel: string }) {
  const baseId = useId();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    const clamped = (index + items.length) % items.length;
    const item = items[clamped];
    if (!item) return;
    setActive(item.id);
    tabRefs.current[clamped]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(items.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1"
      >
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              {item.label}
              {typeof item.badge === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    selected ? "bg-accent-fg/20" : "bg-surface-2",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className="mt-4 focus-visible:outline-none"
        >
          {item.id === active && item.content}
        </div>
      ))}
    </div>
  );
}
