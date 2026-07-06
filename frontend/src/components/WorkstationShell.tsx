"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "./Header";
import EmptyState from "./EmptyState";
import MasterResumePanel from "./MasterResumePanel";
import GenerationPanel from "./GenerationPanel";
import ResumeListPanel from "./ResumeListPanel";
import EvaluationPanel from "./EvaluationPanel";
import ChatPanel from "./ChatPanel";
import type { MasterResume, GeneratedResume } from "@/lib/types";
import { api } from "@/lib/api";

type RightTab = "generate" | "history" | "evaluate";

export default function WorkstationShell() {
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("generate");
  const [selectedResume, setSelectedResume] = useState<GeneratedResume | null>(null);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    api.getMasterResume().then((r) => { setMasterResume(r); setLoading(false); });
  }, []);

  const handleImport = useCallback((r: MasterResume) => setMasterResume(r), []);
  const handleLoadSample = useCallback((yaml: string) => {
    setMasterResume({ id: 0, user_id: "default", yaml_content: yaml, updated_at: "" });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      {!masterResume ? (
        <EmptyState onImport={handleImport} onLoadSample={handleLoadSample} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: YAML editor + preview */}
          <div className="flex flex-col w-1/2 border-r border-border overflow-hidden">
            <MasterResumePanel
              resume={masterResume}
              onSave={setMasterResume}
              onDelete={() => setMasterResume(null)}
            />
          </div>
          {/* Right panel: tabbed */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex border-b border-border">
              {(["generate", "history", "evaluate"] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`px-4 py-2 text-sm capitalize transition ${
                    rightTab === tab
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "history" ? "Resumes" : tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {rightTab === "generate" && (
                <GenerationPanel
                  masterResume={masterResume}
                  onGenerated={(r) => { setSelectedResume(r); setRightTab("history"); }}
                />
              )}
              {rightTab === "history" && (
                <ResumeListPanel
                  selected={selectedResume}
                  onSelect={setSelectedResume}
                />
              )}
              {rightTab === "evaluate" && (
                <EvaluationPanel masterResume={masterResume} />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Chat panel */}
      {masterResume && (
        <div
          className={`border-t border-border transition-all ${chatOpen ? "h-64" : "h-10"}`}
        >
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="w-full h-10 flex items-center px-4 text-sm text-muted-foreground hover:text-foreground"
          >
            AI Chat Assistant {chatOpen ? "▼" : "▲"}
          </button>
          {chatOpen && <ChatPanel masterResume={masterResume} onAction={setMasterResume} />}
        </div>
      )}
    </div>
  );
}
