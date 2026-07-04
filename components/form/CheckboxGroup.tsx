import { cn } from "@/lib/cn";

export interface CheckboxOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Accessible multi-select rendered as a fieldset of toggle chips backed by
 * native checkboxes (keyboard + screen-reader friendly). The visual chip is a
 * styled <label>; the real checkbox is visually hidden but focusable.
 */
export function CheckboxGroup<T extends string>({
  legend,
  name,
  options,
  selected,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: ReadonlyArray<CheckboxOption<T>>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
  error?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;

  const toggle = (value: T) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="mb-1.5 text-sm font-medium text-text">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer select-none rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                "focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg",
                checked
                  ? "border-accent bg-accent/10 font-medium text-accent"
                  : "border-border bg-surface text-text hover:bg-surface-2",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
