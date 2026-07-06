"use client";
import { useState } from "react";
import { readSseStream } from "@/lib/sse";
import type { MasterResume, EvaluationResult } from "@/lib/types";

interface Props { masterResume: MasterResume; }

export default function EvaluationPanel({ masterResume }: Props) {
  const [jd, setJd] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEvaluate() {
    if (!jd.trim()) return;
    setEvaluating(true);
    setError(null);
    setResult(null);
    try {
      for await (const event of readSseStream("/api/evaluate/stream", {
        yaml_content: masterResume.yaml_content,
        job_description: jd,
      })) {
        if (event.event === "done") {
          setResult((event.data as { result: EvaluationResult }).result);
        } else if (event.event === "error") {
          setError((event.data as { error: string }).error);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Job Description to Evaluate Against</label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description..."
          rows={6}
          className="bg-input border border-border rounded p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <button
        data-testid="evaluate-button"
        onClick={handleEvaluate}
        disabled={evaluating || !jd.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover disabled:opacity-50 transition text-sm font-medium"
      >
        {evaluating ? "Evaluating..." : "Evaluate Resume"}
      </button>
      {error && <p className="text-error text-sm">{error}</p>}
      {result && (
        <div data-testid="evaluate-result" className="flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{result.match_score}%</span>
            <span className="text-sm text-muted-foreground">ATS keyword match</span>
          </div>
          <p className="text-sm text-foreground">{result.critique}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-success mb-1">Matched Keywords</p>
              <div className="flex flex-wrap gap-1">
                {result.matched_keywords.map((k) => (
                  <span key={k} className="px-2 py-0.5 text-xs bg-card border border-border rounded text-success">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-warning mb-1">Missing Keywords</p>
              <div className="flex flex-wrap gap-1">
                {result.missing_keywords.map((k) => (
                  <span key={k} className="px-2 py-0.5 text-xs bg-card border border-border rounded text-warning">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
