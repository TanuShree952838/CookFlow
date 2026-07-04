import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading placeholder that mirrors the final dashboard layout so the transition
 * to real content is smooth. The status message lives in a polite live region
 * for screen readers.
 */
export function PlanSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" role="status" aria-live="polite">
        Generating your cooking plan, please wait.
      </p>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-6 w-48" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
