"use client";
export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <span className="text-lg font-semibold tracking-tight text-foreground">
        ResumeTailor
      </span>
      <span className="text-xs text-muted-foreground">AI Resume Workstation</span>
    </header>
  );
}
