"use client";
import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Download, Trash2 } from "lucide-react";
import PdfPreview from "./PdfPreview";
import Button from "./ui/Button";
import SegmentedControl from "./ui/SegmentedControl";
import Spinner from "./ui/Spinner";
import type { GeneratedResume, SortField, SortOrder } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  selected: GeneratedResume | null;
  onSelect: (r: GeneratedResume) => void;
  onDeleted?: (id: number) => void;
}

export default function ResumeListPanel({ selected, onSelect, onDeleted }: Props) {
  const [items, setItems] = useState<GeneratedResume[]>([]);
  const [sort, setSort] = useState<SortField>("date");
  const [order] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async (s: SortField) => {
    setLoading(true);
    try {
      const data = await api.listResumes(s, order);
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [order]);

  useEffect(() => { fetchList(sort); }, [sort, fetchList]);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.deleteResume(id);
      onDeleted?.(id);
    } catch {
      // list refresh below will show the true state either way
    }
    fetchList(sort);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-lg text-foreground">Library</h1>
          <span className="text-xs text-muted-foreground">
            {items.length} tailored {items.length === 1 ? "resume" : "resumes"}
          </span>
        </div>
        <SegmentedControl<SortField>
          value={sort}
          onChange={setSort}
          options={[
            { value: "date", label: "By Date", testId: "sort-date" },
            { value: "jd", label: "By JD", testId: "sort-jd" },
          ]}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <div
          data-testid="resume-list"
          className="w-[320px] shrink-0 overflow-y-auto border-r border-border p-3"
        >
          {loading ? (
            <div className="flex justify-center p-6">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No tailored resumes yet. Generate one from a job description and it will be saved
              here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  data-testid="resume-list-item"
                  onClick={() => onSelect(r)}
                  className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
                    selected?.id === r.id
                      ? "border-accent/40 bg-accent-dim"
                      : "border-border bg-surface-1 hover:border-border-strong hover:bg-surface-2"
                  }`}
                >
                  <p data-testid="resume-name" className="truncate text-sm font-medium text-foreground">
                    {r.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {r.job_description.slice(0, 80)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-faint">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDelete(r.id, e)}
                      aria-label={`Delete ${r.name}`}
                      className="rounded p-1 text-faint opacity-0 transition-all hover:bg-error/10 hover:text-error focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-surface-1">
          {selected?.pdf_path ? (
            <>
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                <p className="truncate text-sm font-medium text-foreground">{selected.name}</p>
                <a
                  href={api.getPdfUrl(selected.id)}
                  download
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface-1 px-2.5 text-xs text-foreground transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <Download size={13} /> Download
                </a>
              </div>
              <div className="min-h-0 flex-1">
                <PdfPreview
                  pdfUrl={`/api/resumes/${selected.id}/pdf`}
                  testId="generated-resume-preview"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="seam-dashed flex h-12 w-12 items-center justify-center rounded-full border">
                <FolderOpen size={18} className="text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Select a resume to preview it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
