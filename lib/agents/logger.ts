import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";

interface LogInput {
  leadId?: string;
  agent: "orchestrator" | "research" | "qualification" | "outreach" | "closing" | "web_design" | "client_success";
  eventType: string;
  level?: "info" | "warning" | "error";
  payload?: Record<string, unknown>;
}

export async function writeAgentLog({ leadId, agent, eventType, level = "info", payload = {} }: LogInput): Promise<void> {
  const message = await buildNaturalLogMessage({ agent, eventType, level, payload });

  const { error } = await supabaseAdmin.from("agent_logs").insert({
    lead_id: leadId ?? null,
    agent,
    event_type: eventType,
    level,
    message,
    payload
  });

  if (error) {
    throw new Error(`Failed to persist agent log: ${error.message}`);
  }
}

async function buildNaturalLogMessage(input: {
  agent: string;
  eventType: string;
  level: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Generate one concise operational log line in plain English. Keep it factual, specific, and no more than 24 words. No prefixes."
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ]
  });

  const text = response.output_text?.trim();
  if (text) {
    return text;
  }

  return JSON.stringify(input);
}
