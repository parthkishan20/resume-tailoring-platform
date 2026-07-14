"use client";
import { useState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { readSseStream } from "@/lib/sse";
import { api } from "@/lib/api";
import type { ChatMessage, MasterResume } from "@/lib/types";

interface Props {
  masterResume: MasterResume;
  onAction: (r: MasterResume) => void;
}

export default function ChatPanel({ masterResume: _masterResume, onAction }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatHistory().then(setMessages).catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user_id: "default", role: "user", content: userMsg, created_at: new Date().toISOString() },
    ]);
    let assistantText = "";
    try {
      for await (const event of readSseStream("/api/chat/stream", { message: userMsg })) {
        if (event.event === "token") {
          assistantText += (event.data as { delta: string }).delta;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id < 0) {
              return [...prev.slice(0, -1), { ...last, content: assistantText }];
            }
            return [
              ...prev,
              { id: -1, user_id: "default", role: "assistant", content: assistantText, created_at: new Date().toISOString() },
            ];
          });
        } else if (event.event === "done") {
          const result = event.data as { result: { text: string; action: unknown } };
          // Refresh master resume if action indicates update
          if ((result.result?.action as { type?: string })?.type === "master_resume_updated") {
            api.getMasterResume().then((r) => r && onAction(r));
          }
        } else if (event.event === "error") {
          setError((event.data as { error: string }).error);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setSending(false);
    }
  }

  const waitingForReply = sending && messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !sending && (
          <p className="px-2 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
            Ask for edits to your master resume — rewrite a section, add a bullet, restructure
            the YAML. Changes apply directly.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            data-testid="chat-message"
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-3.5 py-2 text-sm text-foreground">
                {m.content}
              </div>
            ) : (
              <div className="flex max-w-[95%] gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {waitingForReply && (
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-border p-3">
        {error && <p className="mb-2 text-xs text-error">{error}</p>}
        <div className="flex items-end gap-2 rounded-lg border border-border bg-input p-1.5 focus-within:border-border-strong">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask the AI assistant..."
            rows={2}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-faint focus:outline-none"
          />
          <button
            data-testid="chat-send"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            <SendHorizontal size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
