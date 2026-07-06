"use client";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import PdfPreview from "./PdfPreview";
import type { MasterResume } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  resume: MasterResume;
  onSave: (r: MasterResume) => void;
  onDelete: () => void;
}

export default function MasterResumePanel({ resume, onSave, onDelete }: Props) {
  const [yaml, setYaml] = useState(resume.yaml_content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.saveMasterResume(yaml);
      onSave(updated);
      setPreviewKey((k) => k + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete master resume?")) return;
    await api.deleteMasterResume();
    onDelete();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">Master Resume</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="px-3 py-1 text-xs border border-border rounded hover:bg-card transition"
          >
            {showPreview ? "Editor" : "Preview"}
          </button>
          <button
            data-testid="save-master-resume"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary-hover disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-xs border border-border text-muted-foreground rounded hover:bg-card transition"
          >
            Delete
          </button>
        </div>
      </div>
      {error && <p className="px-4 py-1 text-xs text-error">{error}</p>}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <PdfPreview key={previewKey} pdfUrl="/api/master-resume/preview" testId="resume-preview" />
        ) : (
          <div data-testid="yaml-editor" className="h-full">
            <CodeMirror
              value={yaml}
              height="100%"
              extensions={[yamlLang()]}
              onChange={setYaml}
              theme="dark"
              basicSetup={{ lineNumbers: true }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
