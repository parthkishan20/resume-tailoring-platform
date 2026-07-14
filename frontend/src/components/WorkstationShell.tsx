"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import EmptyState from "./EmptyState";
import MasterResumePanel from "./MasterResumePanel";
import GenerationPanel from "./GenerationPanel";
import ResumeListPanel from "./ResumeListPanel";
import EvaluationPanel from "./EvaluationPanel";
import ChatDrawer from "./ChatDrawer";
import Spinner from "./ui/Spinner";
import type { MasterResume, GeneratedResume, View } from "@/lib/types";
import { api } from "@/lib/api";

export default function WorkstationShell() {
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("editor");
  const [selectedResume, setSelectedResume] = useState<GeneratedResume | null>(null);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    api.getMasterResume().then((r) => { setMasterResume(r); setLoading(false); });
  }, []);

  const handleImport = useCallback((r: MasterResume) => setMasterResume(r), []);
  const handleLoadSample = useCallback(async (yaml: string) => {
    // Persist immediately so preview/generation/delete work without a manual save
    const saved = await api.saveMasterResume(yaml);
    setMasterResume(saved);
  }, []);
  const handleResumeDeleted = useCallback((id: number) => {
    setSelectedResume((s) => (s?.id === id ? null : s));
  }, []);
  const handleGenerated = useCallback((r: GeneratedResume) => setSelectedResume(r), []);
  const handleMasterDeleted = useCallback(() => {
    setMasterResume(null);
    setView("editor");
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <span className="font-display text-3xl italic text-foreground">
          Resume<span className="text-accent">Tailor</span>
        </span>
        <Spinner className="text-accent" />
      </div>
    );
  }

  if (!masterResume) {
    return <EmptyState onImport={handleImport} onLoadSample={handleLoadSample} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={setView}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((o) => !o)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {view === "editor" && (
          <MasterResumePanel
            resume={masterResume}
            onSave={setMasterResume}
            onDelete={handleMasterDeleted}
          />
        )}
        {view === "generate" && (
          <GenerationPanel masterResume={masterResume} onGenerated={handleGenerated} />
        )}
        {view === "resumes" && (
          <ResumeListPanel
            selected={selectedResume}
            onSelect={setSelectedResume}
            onDeleted={handleResumeDeleted}
          />
        )}
        {view === "evaluate" && <EvaluationPanel masterResume={masterResume} />}
      </main>
      {chatOpen && (
        <ChatDrawer
          masterResume={masterResume}
          onAction={setMasterResume}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
