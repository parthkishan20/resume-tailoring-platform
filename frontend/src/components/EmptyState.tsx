"use client";
import { useState, useRef } from "react";
import { UploadCloud, FileDown } from "lucide-react";
import Button from "./ui/Button";
import Spinner from "./ui/Spinner";
import type { MasterResume } from "@/lib/types";
import { api } from "@/lib/api";

const SAMPLE_YAML = `cv:
  name: Your Name
  email: you@example.com
  phone: "+1 555 000 0000"
  location: City, State
  sections:
    education:
    - institution: Your University
      area: Computer Science
      degree: Bachelor of Science
      start_date: 2018-09
      end_date: 2022-05
    experience:
    - company: Your Company
      position: Software Engineer
      start_date: 2022-06
      end_date: present
      location: City, State
      highlights:
      - Built and shipped production features using Python and TypeScript.
      - Reduced API latency by 40 percent through caching and query optimization.
    skills:
    - label: Languages
      details: Python, TypeScript, SQL
    - label: Tools
      details: Docker, Git, FastAPI, React, PostgreSQL
`;

interface Props {
  onImport: (resume: MasterResume) => void;
  onLoadSample: (yaml: string) => Promise<void>;
}

export default function EmptyState({ onImport, onLoadSample }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadSample() {
    setError(null);
    try {
      await onLoadSample(SAMPLE_YAML);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load sample");
    }
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) { setError("Please upload a PDF file."); return; }
    setImporting(true);
    setError(null);
    try {
      const result = await api.importPdf(file);
      onImport(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      data-testid="empty-state"
      className="flex h-screen flex-col items-center justify-center gap-10 p-8 text-center"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-1 font-display text-2xl italic text-accent">
          R
        </div>
        <div>
          <h1 className="font-display text-4xl text-foreground">
            Every job deserves a <span className="italic text-accent">tailored</span> resume.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Keep one master resume as your single source of truth. ResumeTailor cuts and
            re-stitches it to fit each job description.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleLoadSample}>
          Start from Sample
        </Button>
        <a
          href={`data:text/yaml;charset=utf-8,${encodeURIComponent(SAMPLE_YAML)}`}
          download="master-resume.yaml"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-1 px-4 text-sm text-foreground transition-colors hover:border-border-strong hover:bg-surface-2"
        >
          <FileDown size={15} /> Download Sample YAML
        </a>
      </div>

      <div
        data-testid="pdf-import-zone"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="seam-dashed w-full max-w-md cursor-pointer rounded-xl border-2 bg-surface-1/50 p-8 transition-colors hover:bg-accent-dim"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {importing ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner className="text-accent" />
            <p className="text-sm text-muted-foreground">Converting your PDF to YAML…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud size={22} className="text-accent" />
            <p className="text-sm font-medium text-foreground">Drop your existing resume PDF here</p>
            <p className="text-xs text-muted-foreground">
              or click to browse — AI will convert it to YAML
            </p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        New to render-cv format?{" "}
        <a
          href="https://rendercv.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-accent/50 underline-offset-2 transition-colors hover:text-foreground"
        >
          rendercv.com
        </a>
      </p>
    </div>
  );
}
