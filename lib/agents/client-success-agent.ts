import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead } from "@/lib/types";
import { writeAgentLog } from "@/lib/agents/logger";

export async function notifyClientSuccess(lead: Lead): Promise<void> {
  const message = [
    `Client: ${lead.title}`,
    `Status: ${lead.status}`,
    `Primary Contact: ${lead.decision_maker_name ?? "Unknown"}`,
    `Email: ${lead.decision_maker_email ?? lead.company_email ?? "Unavailable"}`,
    `Phone: ${lead.company_phone ?? "Unavailable"}`,
    `Preferred Channel: ${lead.communication_channel}`
  ].join("\n");

  if (lead.communication_channel === "telegram") {
    await sendTelegram(message);
  }

  await supabaseAdmin.from("leads").update({ status: "success_managed" }).eq("id", lead.id);

  await writeAgentLog({
    leadId: lead.id,
    agent: "client_success",
    eventType: "client_success_notified",
    payload: {
      communication_channel: lead.communication_channel
    }
  });
}

async function sendTelegram(text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required for Telegram delivery.");
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram delivery failed: ${details}`);
  }
}
