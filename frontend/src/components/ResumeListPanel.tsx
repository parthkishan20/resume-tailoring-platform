"use client";
import { useState, useEffect, useCallback } from "react";
import PdfPreview from "./PdfPreview";
import type { GeneratedResume, SortField, SortOrder } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  selected: GeneratedResume | null;
  onSelect: (r: GeneratedResume) => void;
}

export default function ResumeListPanel({ selected, onSelect }: Props) {
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
    await api.deleteResume(id);
    fetchList(sort);
  }

  return (
    <div className="flex h-full">
      <div className="w-64 flex flex-col border-r border-border overflow-hidden">
        <div className="flex gap-1 p-2 border-b border-border">
          <button
            data-testid="sort-date"
            onClick={() => setSort("date")}
            className={`flex-1 px-2 py-1 text-xs rounded transition ${sort === "date" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card"}`}
          >
            By Date
          </button>
          <button
            data-testid="sort-jd"
            onClick={() => setSort("jd")}
            className={`flex-1 px-2 py-1 text-xs rounded transition ${sort === "jd" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card"}`}
          >
            By JD
          </button>
        </div>
        <div data-testid="resume-list" className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No resumes yet.</p>
          ) : (
            items.map((r) => (
              <div
                key={r.id}
                data-testid="resume-list-item"
                onClick={() => onSelect(r)}
                className={`p-3 border-b border-border cursor-pointer hover:bg-card transition ${selected?.id === r.id ? "bg-card" : ""}`}
              >
                <p data-testid="resume-name" className="text-sm text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{r.job_description.slice(0, 60)}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(r.id, e)}
                    className="text-xs text-muted-foreground hover:text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1">
        {selected?.pdf_path ? (
          <PdfPreview pdfUrl={`/api/resumes/${selected.id}/pdf`} testId="generated-resume-preview" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a resume to preview
          </div>
        )}
      </div>
    </div>
  );
}
