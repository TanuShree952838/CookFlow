import { cn } from "@/lib/cn";

/**
 * Shimmer placeholder used while a plan is generating. Decorative only, hidden
 * from assistive tech (the loading state is announced separately via aria-live).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-2",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r",
        "before:from-transparent before:via-black/5 before:to-transparent",
        "dark:before:via-white/10",
        "motion-reduce:before:animate-none",
        className,
      )}
    />
  );
}
