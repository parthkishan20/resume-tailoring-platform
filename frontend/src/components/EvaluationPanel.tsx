"use client";
import { useState } from "react";
import { Gauge } from "lucide-react";
import { readSseStream } from "@/lib/sse";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import Spinner from "./ui/Spinner";
import type { MasterResume, EvaluationResult } from "@/lib/types";

interface Props { masterResume: MasterResume; }

function scoreColor(score: number) {
  if (score < 50) return "var(--error)";
  if (score < 75) return "var(--warning)";
  return "var(--success)";
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        {/* stitched track */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="var(--border-strong)" strokeWidth="4" strokeDasharray="2 6"
          strokeLinecap="round"
        />
        {/* wound thread */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={scoreColor(score)} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">match</span>
      </div>
    </div>
  );
}

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
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <h1 className="font-display text-lg text-foreground">Evaluate</h1>
        <span className="ml-3 text-xs text-muted-foreground">
          Score your master resume against a job description
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Input column */}
        <div className="flex w-[420px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="eval-jd" className="text-sm font-medium text-foreground">
              Job description to evaluate against
            </label>
            <textarea
              id="eval-jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description..."
              rows={12}
              className="resize-none rounded-md border border-border bg-input p-3 text-sm text-foreground placeholder:text-faint focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-ring/50"
            />
          </div>
          <Button
            data-testid="evaluate-button"
            variant="primary"
            onClick={handleEvaluate}
            disabled={evaluating || !jd.trim()}
            className="w-full"
          >
            {evaluating ? <Spinner className="h-4 w-4" /> : <Gauge size={15} />}
            {evaluating ? "Evaluating…" : "Evaluate resume"}
          </Button>
          {error && (
            <p className="rounded-md border border-error/25 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </div>
        {/* Result column */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-surface-1">
          {result ? (
            <div data-testid="evaluate-result" className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
              <div className="flex items-center gap-6">
                <ScoreRing score={result.match_score} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">ATS keyword match</span>
                  <span className="text-xs text-muted-foreground">
                    {result.matched_keywords.length} matched ·{" "}
                    {result.missing_keywords.length} missing
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm leading-relaxed text-foreground">{result.critique}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-success">
                    Matched keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_keywords.map((k) => (
                      <Badge key={k} tone="success">{k}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-warning">
                    Missing keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((k) => (
                      <Badge key={k} tone="warning">{k}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : evaluating ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Spinner className="h-5 w-5 text-accent" />
              <p className="text-sm text-muted-foreground">Reading your resume against the role…</p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="seam-dashed flex h-12 w-12 items-center justify-center rounded-full border">
                <Gauge size={18} className="text-accent" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Paste a job description to see your match score, keyword coverage, and a critique.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
