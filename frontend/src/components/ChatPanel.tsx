"use client";
import { useState, useEffect, useRef } from "react";
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            data-testid="chat-message"
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex flex-col p-2 border-t border-border gap-1">
        {error && <p className="text-error text-sm mt-1">{error}</p>}
        <div className="flex gap-2">
        <textarea
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask the AI assistant..."
          rows={2}
          className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          data-testid="chat-send"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover disabled:opacity-50 transition text-sm"
        >
          Send
        </button>
        </div>
      </div>
    </div>
  );
}
