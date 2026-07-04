"use client";

import { useState } from "react";
import type { DayContext } from "@/lib/types";
import { useGeneratePlan } from "@/hooks/useGeneratePlan";
import { DayContextForm } from "@/components/form/DayContextForm";
import { PlanDashboard } from "@/components/results/PlanDashboard";
import { PlanSkeleton } from "@/components/results/PlanSkeleton";
import { ResultsErrorBoundary } from "@/components/results/ResultsErrorBoundary";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Toast } from "@/components/ui/Toast";

export default function HomePage() {
  const { status, plan, meta, error, generate } = useGeneratePlan();
  const [lastContext, setLastContext] = useState<DayContext | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isLoading = status === "loading";

  const handleSubmit = (context: DayContext) => {
    setLastContext(context);
    generate(context);
  };

  const retry = () => {
    if (lastContext) generate(lastContext);
  };

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Plan your day&apos;s cooking in seconds
        </h1>
        <p className="mt-2 text-muted">
          Tell CookFlow about your day and budget. It builds a timed cooking
          to-do list, a consolidated grocery list, smart substitutions, and
          checks it all against your budget.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section aria-label="Plan inputs" className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <DayContextForm onSubmit={handleSubmit} isSubmitting={isLoading} />
          </div>
        </section>

        <section aria-label="Your plan" aria-busy={isLoading}>
          {isLoading && <PlanSkeleton />}

          {!isLoading && status === "error" && error && (
            <div className="flex flex-col gap-4">
              <ErrorBanner message={error.message} onRetry={lastContext ? retry : undefined} />
              {plan && (
                <ResultsErrorBoundary>
                  <PlanDashboard plan={plan} meta={meta} onCopied={setToast} />
                </ResultsErrorBoundary>
              )}
            </div>
          )}

          {!isLoading && status === "success" && plan && (
            <ResultsErrorBoundary>
              <PlanDashboard plan={plan} meta={meta} onCopied={setToast} />
            </ResultsErrorBoundary>
          )}

          {!isLoading && status === "idle" && !plan && (
            <EmptyState
              title="No plan yet"
              description="Fill in your day on the left and generate a plan to see your meals, cooking timeline, grocery list, and budget here."
            />
          )}
        </section>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </main>
  );
}
