"use client";

type Tone = "success" | "warning" | "error" | "neutral";

const tones: Record<Tone, string> = {
  success: "text-success border-success/25 bg-success/10",
  warning: "text-warning border-warning/25 bg-warning/10",
  error: "text-error border-error/25 bg-error/10",
  neutral: "text-muted-foreground border-border bg-surface-2",
};

export default function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
