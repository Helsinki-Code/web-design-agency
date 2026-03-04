import { openai } from "@/lib/openai";
import { parallelClient } from "@/lib/parallel";
import { supabaseAdmin } from "@/lib/supabase";
import { writeAgentLog } from "@/lib/agents/logger";

interface FindAllStartInput {
  objective: string;
  entityType?: string;
  matchLimit?: number;
}

export async function runLeadResearch(input: FindAllStartInput): Promise<{ findallId: string }> {
  const entityType = input.entityType ?? "companies";
  const matchLimit = input.matchLimit ?? 50;

  const run = await parallelClient.beta.findall.create({
    objective: input.objective,
    entity_type: entityType,
    match_conditions: [
      {
        name: "website_quality_check",
        description: "Company website must look outdated, hard to use, or visually low-trust compared to modern peers."
      },
      {
        name: "us_service_business_check",
        description: "Business must provide services in the United States."
      },
      {
        name: "has_reachable_contact_check",
        description: "Business must have at least one reachable outreach channel such as email, phone, or contact form."
      }
    ],
    generator: "core",
    match_limit: matchLimit
  });

  await writeAgentLog({
    agent: "research",
    eventType: "findall_run_created",
    payload: {
      objective: input.objective,
      findallId: run.findall_id,
      entityType,
      matchLimit
    }
  });

  return { findallId: run.findall_id };
}

export async function syncFindAllToLeads(findallId: string): Promise<{ imported: number; status: string }> {
  const runStatus = await parallelClient.beta.findall.retrieve(findallId);
  const status = runStatus.status.status;

  if (!["completed", "running"].includes(status)) {
    await writeAgentLog({
      agent: "research",
      eventType: "findall_sync_skipped",
      level: "warning",
      payload: { findallId, status }
    });

    return { imported: 0, status };
  }

  const result = await parallelClient.beta.findall.result(findallId, {
    betas: ["findall-2025-09-15"]
  });

  const matched = (result.candidates ?? []).filter((candidate: any) => candidate.match_status === "matched");
  let imported = 0;

  for (const candidate of matched) {
    const output = candidate.output ?? {};

    const lead = {
      title: candidate.name ?? "Unnamed Business",
      description: candidate.description ?? null,
      website_url: candidate.url ?? "",
      company_email: output.company_email?.value ?? null,
      company_phone: output.company_phone_number?.value ?? null,
      decision_maker_name: output.decision_maker_name?.value ?? null,
      decision_maker_title: output.decision_maker_title?.value ?? null,
      decision_maker_email: output.decision_maker_email?.value ?? null,
      decision_maker_linkedin_url: output.decision_maker_linkedin_url?.value ?? null,
      status: "discovered",
      metadata: {
        findall_id: findallId,
        candidate_id: candidate.candidate_id,
        basis: candidate.basis ?? []
      }
    };

    const { error } = await supabaseAdmin.from("leads").upsert(lead, { onConflict: "title,website_url" });

    if (!error) {
      imported += 1;
    }
  }

  await writeAgentLog({
    agent: "research",
    eventType: "findall_synced_to_leads",
    payload: { findallId, imported, status }
  });

  return { imported, status };
}

export async function enrichLeadFromWebsite(leadId: string, websiteUrl: string): Promise<void> {
  const extracted = await parallelClient.beta.extract({
    urls: [websiteUrl],
    excerpts: true,
    full_content: true
  });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Evaluate website quality for sales outreach. Return strict JSON with keys score_0_to_100, issues, and opportunity_summary."
      },
      {
        role: "user",
        content: JSON.stringify(extracted)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "website_assessment",
        schema: {
          type: "object",
          properties: {
            score_0_to_100: { type: "number" },
            issues: {
              type: "array",
              items: { type: "string" }
            },
            opportunity_summary: { type: "string" }
          },
          required: ["score_0_to_100", "issues", "opportunity_summary"],
          additionalProperties: false
        }
      }
    }
  });

  const assessment = JSON.parse(response.output_text);

  const { error } = await supabaseAdmin
    .from("leads")
    .update({
      metadata: {
        website_assessment: assessment
      }
    })
    .eq("id", leadId);

  if (error) {
    throw new Error(`Failed to save website assessment: ${error.message}`);
  }

  await writeAgentLog({
    leadId,
    agent: "research",
    eventType: "website_assessed",
    payload: assessment
  });
}
