import { Button } from "@/components/ui/Button";

/**
 * Inline error surface with an assertive live region so screen readers announce
 * failures immediately, plus an optional retry action.
 */
export function ErrorBanner({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-semibold text-danger">{title}</p>
        <p className="mt-0.5 text-sm text-text/80">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
