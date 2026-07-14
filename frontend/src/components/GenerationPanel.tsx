"use client";
import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronRight, Download } from "lucide-react";
import { readSseStream } from "@/lib/sse";
import PdfPreview from "./PdfPreview";
import Button from "./ui/Button";
import Spinner from "./ui/Spinner";
import type { MasterResume, GeneratedResume, Rule } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  masterResume: MasterResume;
  onGenerated: (r: GeneratedResume) => void;
}

const humanize = (s: string) => s.replace(/_/g, " ");

export default function GenerationPanel({ masterResume: _masterResume, onGenerated }: Props) {
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    api.getRules().then(setRules).catch(() => setRules([]));
  }, []);

  async function handleGenerate() {
    if (!jd.trim()) return;
    setGenerating(true);
    setError(null);
    setStatus("Starting…");
    setGenerated(null);
    try {
      for await (const event of readSseStream("/api/resumes/stream", { job_description: jd })) {
        if (event.event === "progress") {
          setStatus((event.data as { message: string }).message);
        } else if (event.event === "done") {
          const result = (event.data as { result: GeneratedResume }).result;
          setGenerated(result);
          onGenerated(result);
          setStatus(null);
        } else if (event.event === "error") {
          setError((event.data as { error: string }).error);
          setStatus(null);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus(null);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRuleChange(section: string, key: string, value: string) {
    if (value.trim() === "") return; // don't persist a cleared input
    try {
      const updated = await api.updateRules([{ section, rule_key: key, rule_value: value }]);
      setRules(updated);
    } catch {
      // silently fail — rules are non-critical
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <h1 className="font-display text-lg text-foreground">Generate</h1>
        <span className="ml-3 text-xs text-muted-foreground">
          Tailor your master resume to a job description
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Input column */}
        <div className="flex w-[420px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="jd-input" className="text-sm font-medium text-foreground">
              Job description
            </label>
            <textarea
              id="jd-input"
              data-testid="job-description"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="resize-none rounded-md border border-border bg-input p-3 text-sm text-foreground placeholder:text-faint focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-ring/50"
            />
          </div>
          <Button
            data-testid="generate-button"
            variant="primary"
            onClick={handleGenerate}
            disabled={generating || !jd.trim()}
            className="w-full"
          >
            {generating ? <Spinner className="h-4 w-4" /> : <Sparkles size={15} />}
            {generating ? status ?? "Generating…" : "Generate tailored resume"}
          </Button>
          {error && (
            <p className="rounded-md border border-error/25 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
          <div className="border-t border-border pt-3">
            <button
              data-testid="rules-toggle"
              onClick={() => setRulesOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {rulesOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              Generation rules
            </button>
            {rulesOpen && (
              <form data-testid="rules-form" className="mt-3 grid grid-cols-2 gap-3">
                {rules.map((r) => (
                  <div key={`${r.section}-${r.rule_key}`} className="flex flex-col gap-1">
                    <label className="text-[11px] capitalize text-muted-foreground">
                      {humanize(r.section)} · {humanize(r.rule_key)}
                    </label>
                    <input
                      type="number"
                      defaultValue={r.rule_value}
                      onBlur={(e) => handleRuleChange(r.section, r.rule_key, e.target.value)}
                      className="w-full rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-foreground focus:border-border-strong focus:outline-none"
                    />
                  </div>
                ))}
              </form>
            )}
          </div>
        </div>
        {/* Result column */}
        <div className="flex min-w-0 flex-1 flex-col bg-surface-1">
          {generated ? (
            <>
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                <p data-testid="resume-name" className="truncate text-sm font-medium text-foreground">
                  {generated.name}
                </p>
                <a
                  href={api.getPdfUrl(generated.id)}
                  download
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface-1 px-2.5 text-xs text-foreground transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <Download size={13} /> Download
                </a>
              </div>
              <div className="min-h-0 flex-1">
                {generated.pdf_path && (
                  <PdfPreview
                    pdfUrl={`/api/resumes/${generated.id}/pdf`}
                    testId="generated-resume-preview"
                  />
                )}
              </div>
            </>
          ) : generating ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Spinner className="h-5 w-5 text-accent" />
              <p className="text-sm text-muted-foreground">{status ?? "Generating…"}</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="seam-dashed flex h-12 w-12 items-center justify-center rounded-full border">
                <Sparkles size={18} className="text-accent" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Paste a job description and the tailored resume will appear here, ready to
                download.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
