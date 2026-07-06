"use client";
import { useState, useEffect } from "react";

interface Props {
  pdfUrl: string;
  testId?: string;
}

export default function PdfPreview({ pdfUrl, testId = "resume-preview" }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string;
    fetch(pdfUrl)
      .then((r) => r.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => setBlobUrl(null));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [pdfUrl]);

  if (!blobUrl) return (
    <div data-testid={testId} className="flex items-center justify-center h-full text-muted-foreground">
      Loading preview...
    </div>
  );
  return (
    <iframe
      data-testid={testId}
      src={blobUrl}
      className="w-full h-full border-0"
      title="Resume PDF Preview"
    />
  );
}
