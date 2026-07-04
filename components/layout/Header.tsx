import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v6a3 3 0 0 0 6 0V3" />
              <path d="M9 3v18" />
              <path d="M17 3c-1.5 1-2 3-2 5s.5 3 2 3 2-1 2-3-.5-4-2-5z" />
              <path d="M17 11v10" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold text-text">CookFlow</p>
            <p className="text-xs text-muted">AI cooking to-do list</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
