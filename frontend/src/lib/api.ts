import type {
  MasterResume, GeneratedResume, ResumeListResponse,
  ChatMessage, Rule, SystemPrompt, SortField, SortOrder,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Master Resume
  getMasterResume: () =>
    request<MasterResume | null>("/api/master-resume").catch(() => null),
  saveMasterResume: (yaml_content: string) =>
    request<MasterResume>("/api/master-resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yaml_content }),
    }),
  deleteMasterResume: () =>
    request<void>("/api/master-resume", { method: "DELETE" }),

  // Generated Resumes
  listResumes: (sort: SortField = "date", order: SortOrder = "desc", page = 1) =>
    request<ResumeListResponse>(
      `/api/resumes?sort=${sort}&order=${order}&page=${page}&limit=20`
    ),
  getResume: (id: number) =>
    request<GeneratedResume>(`/api/resumes/${id}`),
  updateResume: (id: number, patch: { name?: string; yaml_content?: string }) =>
    request<GeneratedResume>(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteResume: (id: number) =>
    request<void>(`/api/resumes/${id}`, { method: "DELETE" }),
  renderResume: (id: number) =>
    request<GeneratedResume>(`/api/resumes/${id}/render`, { method: "POST" }),

  // Chat
  getChatHistory: () => request<ChatMessage[]>("/api/chat"),
  clearChat: () => request<void>("/api/chat", { method: "DELETE" }),

  // Rules
  getRules: () => request<Rule[]>("/api/rules"),
  updateRules: (rules: Rule[]) =>
    request<Rule[]>("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    }),
  resetRules: () => request<Rule[]>("/api/rules", { method: "DELETE" }),

  // System Prompt
  getSystemPrompt: () => request<SystemPrompt>("/api/system-prompt"),
  updateSystemPrompt: (content: string) =>
    request<SystemPrompt>("/api/system-prompt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  resetSystemPrompt: () =>
    request<SystemPrompt>("/api/system-prompt", { method: "DELETE" }),

  // PDF
  getPdfUrl: (id: number) => `/api/resumes/${id}/pdf`,

  // Import PDF (returns master resume)
  importPdf: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<MasterResume>("/api/master-resume/import", {
      method: "POST",
      body: form,
    });
  },
};
