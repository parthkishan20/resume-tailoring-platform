"use client";

interface Option<T extends string> {
  value: T;
  label: string;
  testId?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
}: Props<T>) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center rounded-md border border-border bg-input p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          data-testid={o.testId}
          onClick={() => onChange(o.value)}
          className={`rounded transition-colors ${
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
          } ${
            value === o.value
              ? "bg-surface-2 text-foreground shadow-[0_0_0_1px_var(--border-strong)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
