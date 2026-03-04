import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead, QualificationResult } from "@/lib/types";
import { writeAgentLog } from "@/lib/agents/logger";

export async function qualifyLead(lead: Lead): Promise<QualificationResult> {
  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "You are a B2B outbound qualification engine for a premium web design agency. Return strict JSON."
      },
      {
        role: "user",
        content: JSON.stringify({
          company: lead.title,
          description: lead.description,
          websiteUrl: lead.website_url,
          decisionMaker: {
            name: lead.decision_maker_name,
            title: lead.decision_maker_title,
            email: lead.decision_maker_email
          },
          metadata: lead.metadata
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "qualification_result",
        schema: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            accepted: { type: "boolean" },
            reasoning: { type: "string" },
            outreach_strategy: { type: "string" }
          },
          required: ["score", "accepted", "reasoning", "outreach_strategy"],
          additionalProperties: false
        }
      }
    }
  });

  const result = JSON.parse(response.output_text) as QualificationResult;

  const { error } = await supabaseAdmin
    .from("leads")
    .update({
      qualification_score: result.score,
      qualification_reasoning: result.reasoning,
      status: result.accepted ? "qualified" : "rejected",
      metadata: {
        ...(lead.metadata ?? {}),
        outreach_strategy: result.outreach_strategy
      }
    })
    .eq("id", lead.id);

  if (error) {
    throw new Error(`Failed to save qualification: ${error.message}`);
  }

  await writeAgentLog({
    leadId: lead.id,
    agent: "qualification",
    eventType: "lead_qualified",
    payload: result as unknown as Record<string, unknown>
  });

  return result;
}

export async function getLeadById(leadId: string): Promise<Lead> {
  const { data, error } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).single();

  if (error || !data) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  return data as Lead;
}
