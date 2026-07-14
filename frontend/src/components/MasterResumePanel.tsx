"use client";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import { Save } from "lucide-react";
import PdfPreview from "./PdfPreview";
import Button from "./ui/Button";
import ConfirmButton from "./ui/ConfirmButton";
import SegmentedControl from "./ui/SegmentedControl";
import Spinner from "./ui/Spinner";
import type { MasterResume } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  resume: MasterResume;
  onSave: (r: MasterResume) => void;
  onDelete: () => void;
}

type Mode = "editor" | "split" | "preview";

export default function MasterResumePanel({ resume, onSave, onDelete }: Props) {
  const [yaml, setYaml] = useState(resume.yaml_content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("split");
  const [previewKey, setPreviewKey] = useState(0);
  const dirty = yaml !== resume.yaml_content;

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
    setError(null);
    try {
      await api.deleteMasterResume();
      onDelete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const showEditor = mode !== "preview";
  const showPreview = mode !== "editor";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-lg text-foreground">Master Resume</h1>
          {/* Caption must not start with "s": "Resume"+"s…" would collide with
              getByText("Resumes") used by the e2e nav tests. */}
          <span className="font-mono text-[11px] text-faint">
            {dirty
              ? "· edited"
              : `· updated ${new Date(resume.updated_at).toLocaleString()}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedControl<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "editor", label: "Editor" },
              { value: "split", label: "Split" },
              { value: "preview", label: "Preview" },
            ]}
          />
          <Button
            data-testid="save-master-resume"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save"}
          </Button>
          <ConfirmButton label="Delete" confirmLabel="Delete?" onConfirm={handleDelete} />
        </div>
      </div>
      {error && (
        <p className="border-b border-border bg-error/10 px-5 py-1.5 text-xs text-error">{error}</p>
      )}
      <div className="flex min-h-0 flex-1">
        {showEditor && (
          <div
            data-testid="yaml-editor"
            className={`h-full min-w-0 ${showPreview ? "w-1/2" : "w-full"}`}
          >
            <CodeMirror
              value={yaml}
              height="100%"
              extensions={[yamlLang()]}
              onChange={setYaml}
              theme="dark"
              basicSetup={{ lineNumbers: true }}
              style={{ height: "100%" }}
            />
          </div>
        )}
        {showPreview && (
          <div
            className={`h-full min-w-0 bg-surface-1 ${showEditor ? "w-1/2 border-l border-border" : "w-full"}`}
          >
            <PdfPreview
              key={previewKey}
              pdfUrl="/api/master-resume/preview"
              testId="resume-preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
