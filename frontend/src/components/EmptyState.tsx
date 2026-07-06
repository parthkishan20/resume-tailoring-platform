"use client";
import { useState, useRef } from "react";
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
  onLoadSample: (yaml: string) => void;
}

export default function EmptyState({ onImport, onLoadSample }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) { setError("Please upload a PDF file."); return; }
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
      className="flex flex-col items-center justify-center h-full gap-8 p-8 text-center"
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to ResumeTailor</h2>
        <p className="text-muted-foreground max-w-md">
          Start by creating your master resume — the single source of truth for all generated resumes.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onLoadSample(SAMPLE_YAML)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover transition"
        >
          Start from Sample
        </button>
        <a
          href={`data:text/yaml;charset=utf-8,${encodeURIComponent(SAMPLE_YAML)}`}
          download="master-resume.yaml"
          className="px-4 py-2 border border-border text-foreground rounded hover:bg-card transition"
        >
          Download Sample YAML
        </a>
      </div>

      <div
        data-testid="pdf-import-zone"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-8 w-full max-w-md cursor-pointer hover:border-primary transition"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {importing ? (
          <p className="text-muted-foreground">Importing PDF...</p>
        ) : (
          <>
            <p className="text-foreground font-medium">Drop your existing resume PDF here</p>
            <p className="text-muted-foreground text-sm mt-1">or click to browse — AI will convert it to YAML</p>
          </>
        )}
        {error && <p className="text-error text-sm mt-2">{error}</p>}
      </div>

      <p className="text-muted-foreground text-sm">
        New to render-cv format?{" "}
        <a href="https://rendercv.com" target="_blank" rel="noopener noreferrer"
           className="underline hover:text-foreground">rendercv.com</a>
      </p>
    </div>
  );
}
