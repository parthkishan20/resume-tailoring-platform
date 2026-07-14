"use client";
import { useState, useEffect } from "react";
import Spinner from "./ui/Spinner";

interface Props {
  pdfUrl: string;
  testId?: string;
}

export default function PdfPreview({ pdfUrl, testId = "resume-preview" }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url: string;
    let cancelled = false;
    setBlobUrl(null);
    setError(null);
    fetch(pdfUrl)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail ?? body?.error ?? `Preview failed (${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Preview failed");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [pdfUrl]);

  if (error) return (
    <div data-testid={testId} className="flex h-full items-center justify-center p-6">
      <p className="max-w-sm rounded-md border border-error/25 bg-error/10 px-4 py-3 text-center text-sm text-error">
        {error}
      </p>
    </div>
  );
  if (!blobUrl) return (
    <div data-testid={testId} className="flex h-full flex-col items-center justify-center gap-3">
      <Spinner className="text-accent" />
      <p className="text-xs text-muted-foreground">Rendering PDF…</p>
    </div>
  );
  return (
    <div className="h-full w-full p-3">
      <iframe
        data-testid={testId}
        src={`${blobUrl}#toolbar=0&navpanes=0`}
        className="h-full w-full rounded-lg border border-border bg-white"
        title="Resume PDF Preview"
      />
    </div>
  );
}
