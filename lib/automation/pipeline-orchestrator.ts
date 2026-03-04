import { getLeadById, qualifyLead } from "@/lib/agents/qualification-agent";
import { runLeadResearch, syncFindAllToLeads } from "@/lib/agents/lead-research-agent";
import { sendOutreachEmail } from "@/lib/agents/outreach-agent";
import { createDesignHandoff } from "@/lib/agents/web-design-agent";
import { notifyClientSuccess } from "@/lib/agents/client-success-agent";
import { writeAgentLog } from "@/lib/agents/logger";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead } from "@/lib/types";

export async function runDiscoveryCycle(objective: string): Promise<{ findallId: string; imported: number; status: string }> {
  const { findallId } = await runLeadResearch({ objective });
  const synced = await syncFindAllToLeads(findallId);

  await writeAgentLog({
    agent: "orchestrator",
    eventType: "discovery_cycle_finished",
    payload: {
      objective,
      findallId,
      imported: synced.imported,
      runStatus: synced.status
    }
  });

  return {
    findallId,
    imported: synced.imported,
    status: synced.status
  };
}

export async function runQualificationBatch(limit = 25): Promise<{ processed: number }> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("status", "discovered")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load discovered leads: ${error.message}`);
  }

  let processed = 0;

  for (const row of data as Lead[]) {
    await qualifyLead(row);
    processed += 1;
  }

  await writeAgentLog({
    agent: "orchestrator",
    eventType: "qualification_batch_finished",
    payload: { processed, limit }
  });

  return { processed };
}

export async function runOutreachBatch(limit = 25): Promise<{ sent: number }> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("status", "qualified")
    .order("qualification_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load qualified leads: ${error.message}`);
  }

  let sent = 0;

  for (const row of data as Lead[]) {
    await sendOutreachEmail(row);
    sent += 1;
  }

  await writeAgentLog({
    agent: "orchestrator",
    eventType: "outreach_batch_finished",
    payload: { sent, limit }
  });

  return { sent };
}

export async function runDeliveryPipelineForPaidLead(leadId: string): Promise<void> {
  const lead = await getLeadById(leadId);

  if (lead.status !== "paid") {
    throw new Error(`Lead ${leadId} is not paid. Current status: ${lead.status}`);
  }

  await createDesignHandoff(lead);

  const refreshed = await getLeadById(leadId);
  await notifyClientSuccess(refreshed);

  await writeAgentLog({
    leadId,
    agent: "orchestrator",
    eventType: "delivery_pipeline_finished"
  });
}
