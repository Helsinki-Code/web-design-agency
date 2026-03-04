export type LeadStatus =
  | "discovered"
  | "qualified"
  | "outreach_sent"
  | "interested"
  | "proposal_sent"
  | "invoiced"
  | "paid"
  | "handoff_started"
  | "build_in_progress"
  | "delivered"
  | "success_managed"
  | "rejected";

export interface Lead {
  id: string;
  title: string;
  description: string | null;
  website_url: string | null;
  company_email: string | null;
  company_phone: string | null;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  decision_maker_email: string | null;
  decision_maker_linkedin_url: string | null;
  employee_count: string | null;
  status: LeadStatus;
  qualification_score: number | null;
  qualification_reasoning: string | null;
  redesign_blur_url: string | null;
  redesign_full_url: string | null;
  invoice_url: string | null;
  communication_channel: "email" | "whatsapp" | "telegram";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  lead_id: string | null;
  agent: string;
  event_type: string;
  level: "info" | "warning" | "error";
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface QualificationResult {
  score: number;
  accepted: boolean;
  reasoning: string;
  outreach_strategy: string;
}
