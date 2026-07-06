// SSE stream reader for POST endpoints (generate, chat, evaluate)
// Returns an async generator of parsed SSE events.

export interface SseEvent {
  event: string;
  data: unknown;
}

export async function* readSseStream(
  path: string,
  body: unknown,
  signal?: AbortSignal
): AsyncGenerator<SseEvent> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        try {
          yield { event: currentEvent, data: JSON.parse(raw) };
        } catch {
          yield { event: currentEvent, data: raw };
        }
        currentEvent = "message";
      }
    }
  }
}
