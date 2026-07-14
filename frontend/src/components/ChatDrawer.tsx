"use client";
import { useState } from "react";
import { X, Eraser } from "lucide-react";
import ChatPanel from "./ChatPanel";
import Button from "./ui/Button";
import type { MasterResume } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  masterResume: MasterResume;
  onAction: (r: MasterResume) => void;
  onClose: () => void;
}

export default function ChatDrawer({ masterResume, onAction, onClose }: Props) {
  const [clearKey, setClearKey] = useState(0);

  async function handleClear() {
    try {
      await api.clearChat();
      setClearKey((k) => k + 1); // remount ChatPanel so it refetches empty history
    } catch {
      // non-critical
    }
  }

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-surface-1">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-sm font-medium">Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleClear} aria-label="Clear conversation">
            <Eraser size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close chat">
            <X size={14} />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ChatPanel key={clearKey} masterResume={masterResume} onAction={onAction} />
      </div>
    </aside>
  );
}
