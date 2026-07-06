export interface MasterResume {
  id: number;
  user_id: string;
  yaml_content: string;
  updated_at: string;
}

export interface GeneratedResume {
  id: number;
  user_id: string;
  name: string;
  job_description: string;
  yaml_content?: string;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeListResponse {
  items: GeneratedResume[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Rule {
  section: string;
  rule_key: string;
  rule_value: string;
}

export interface SystemPrompt {
  id: number;
  user_id: string;
  content: string;
  updated_at: string;
}

export interface EvaluationResult {
  match_score: number;
  critique: string;
  matched_keywords: string[];
  missing_keywords: string[];
}

export interface ChatAction {
  type: "resume_created" | "master_resume_updated" | "evaluation_complete" | "rules_updated";
  resume_id?: number;
}

export interface SseProgressEvent { message: string; }
export interface SseTokenEvent { delta: string; }
export interface SseErrorEvent { error: string; code: string; }

export type SortField = "date" | "jd";
export type SortOrder = "asc" | "desc";
