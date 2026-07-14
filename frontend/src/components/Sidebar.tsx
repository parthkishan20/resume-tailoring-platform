"use client";
import { FileText, Sparkles, FolderOpen, Gauge, MessageSquare } from "lucide-react";
import type { View } from "@/lib/types";

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  chatOpen: boolean;
  onToggleChat: () => void;
}

const NAV: { view: View; label: string; icon: typeof FileText }[] = [
  { view: "editor", label: "Editor", icon: FileText },
  { view: "generate", label: "Generate", icon: Sparkles },
  { view: "resumes", label: "Resumes", icon: FolderOpen },
  { view: "evaluate", label: "Evaluate", icon: Gauge },
];

function NavButton({
  active,
  label,
  icon: Icon,
  onClick,
  testId,
  subtle = false,
}: {
  active: boolean;
  label: string;
  icon: typeof FileText;
  onClick: () => void;
  testId: string;
  subtle?: boolean;
}) {
  // subtle: a toggle (chat) rather than a location — gold text only, no stitch,
  // so it never competes with the current-view indicator
  const activeClass = subtle ? "text-accent" : "bg-accent-dim text-accent";
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      aria-current={active && !subtle ? "page" : undefined}
      aria-pressed={subtle ? active : undefined}
      className={`relative flex w-full flex-col items-center gap-1 rounded-md py-2.5 transition-colors ${
        active ? activeClass : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {/* gold stitch on the active seam */}
      {active && !subtle && (
        <span
          aria-hidden="true"
          className="seam-dashed absolute left-0 top-1.5 bottom-1.5 border-l-2"
        />
      )}
      <Icon size={18} strokeWidth={1.75} />
      <span className="text-[10px] leading-none tracking-wide">{label}</span>
    </button>
  );
}

export default function Sidebar({ view, onNavigate, chatOpen, onToggleChat }: Props) {
  return (
    <nav className="flex h-full w-[76px] shrink-0 flex-col items-center border-r border-border bg-background px-2 py-4">
      <div
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-1 font-display text-xl italic text-accent"
        title="ResumeTailor"
      >
        R
      </div>
      <div className="flex w-full flex-col gap-1.5">
        {NAV.map((item) => (
          <NavButton
            key={item.view}
            active={view === item.view}
            label={item.label}
            icon={item.icon}
            onClick={() => onNavigate(item.view)}
            testId={`nav-${item.view}`}
          />
        ))}
      </div>
      <div className="mt-auto w-full">
        <NavButton
          active={chatOpen}
          label="Chat"
          icon={MessageSquare}
          onClick={onToggleChat}
          testId="nav-chat"
          subtle
        />
      </div>
    </nav>
  );
}
