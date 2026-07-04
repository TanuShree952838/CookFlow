"use client";

import { useMemo, useState } from "react";
import type { CookingTask } from "@/lib/types";
import { formatDuration, MEAL_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

/**
 * Interactive cooking checklist. Completion state is local (a transient "cook
 * mode" aid), and a live region announces progress as tasks are checked off.
 */
export function TodoTimeline({ tasks }: { tasks: CookingTask[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const completedCount = useMemo(
    () => tasks.filter((task) => done.has(task.id)).length,
    [tasks, done],
  );
  const percent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          {completedCount} of {tasks.length} tasks done
        </p>
        <span className="text-sm text-muted" aria-live="polite">
          {percent}%
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {tasks.map((task) => {
          const checked = done.has(task.id);
          return (
            <li key={task.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                  "focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg",
                  checked
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(task.id)}
                  className="h-5 w-5 shrink-0 rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                <span className="w-14 shrink-0 font-mono text-sm font-medium text-accent">
                  {task.time}
                </span>
                <span
                  className={cn(
                    "flex-1 text-sm text-text",
                    checked && "text-muted line-through",
                  )}
                >
                  {task.title}
                </span>
                <span className="hidden shrink-0 sm:block">
                  <Badge tone="neutral">{MEAL_LABELS[task.meal]}</Badge>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {formatDuration(task.durationMinutes)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
