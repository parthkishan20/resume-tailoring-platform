"use client";
import { useState, useEffect } from "react";
import { readSseStream } from "@/lib/sse";
import PdfPreview from "./PdfPreview";
import type { MasterResume, GeneratedResume, Rule } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  masterResume: MasterResume;
  onGenerated: (r: GeneratedResume) => void;
}

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
    setStatus("Starting...");
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
    try {
      const updated = await api.updateRules([{ section, rule_key: key, rule_value: value }]);
      setRules(updated);
    } catch {
      // silently fail — rules are non-critical
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Job Description</label>
        <textarea
          data-testid="job-description"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className="bg-input border border-border rounded p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <button
        data-testid="generate-button"
        onClick={handleGenerate}
        disabled={generating || !jd.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover disabled:opacity-50 transition text-sm font-medium"
      >
        {generating ? status ?? "Generating..." : "Generate Tailored Resume"}
      </button>
      {error && <p className="text-error text-sm">{error}</p>}
      <div>
        <button
          onClick={() => setRulesOpen((o) => !o)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Generation Rules {rulesOpen ? "▲" : "▼"}
        </button>
        {rulesOpen && (
          <form data-testid="rules-form" className="mt-2 grid grid-cols-2 gap-2">
            {rules.map((r) => (
              <div key={`${r.section}-${r.rule_key}`} className="flex flex-col gap-0.5">
                <label className="text-xs text-muted-foreground">{r.section} / {r.rule_key}</label>
                <input
                  type="number"
                  defaultValue={r.rule_value}
                  onBlur={(e) => handleRuleChange(r.section, r.rule_key, e.target.value)}
                  className="bg-input border border-border rounded px-2 py-1 text-xs text-foreground w-full"
                />
              </div>
            ))}
          </form>
        )}
      </div>
      {generated && (
        <div className="flex-1 flex flex-col gap-2">
          <p data-testid="resume-name" className="text-sm font-medium text-foreground">
            {generated.name}
          </p>
          {generated.pdf_path && (
            <div className="flex-1">
              <PdfPreview
                pdfUrl={`/api/resumes/${generated.id}/pdf`}
                testId="generated-resume-preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
