"use client";

import { useEffect } from "react";

/**
 * Transient success notification. Rendered in a polite live region so screen
 * readers announce it without interrupting, and auto-dismisses after a delay.
 */
export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-2 rounded-full border border-success/30 bg-surface px-4 py-2 text-sm font-medium text-text shadow-lg animate-fade-in"
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
      {message}
    </div>
  );
}
