import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead } from "@/lib/types";
import { writeAgentLog } from "@/lib/agents/logger";
import { createRedesignPreview } from "@/lib/agents/web-design-agent";

export async function sendOutreachEmail(lead: Lead): Promise<void> {
  const to = lead.decision_maker_email ?? lead.company_email;

  if (!to) {
    await writeAgentLog({
      leadId: lead.id,
      agent: "outreach",
      eventType: "outreach_skipped_no_email",
      level: "warning"
    });
    return;
  }

  let blurUrl = lead.redesign_blur_url;

  if (!blurUrl) {
    const preview = await createRedesignPreview(lead);
    blurUrl = preview.blurUrl;
  }

  const strategy = String((lead.metadata ?? {}).outreach_strategy ?? "");

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Write one compliant, personalized cold email for a premium web redesign offer. Include a single blurred preview link. Return JSON with subject and body_text."
      },
      {
        role: "user",
        content: JSON.stringify({
          company: lead.title,
          recipientName: lead.decision_maker_name,
          recipientTitle: lead.decision_maker_title,
          websiteUrl: lead.website_url,
          strategy,
          blurPreviewUrl: blurUrl
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "cold_email",
        schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body_text: { type: "string" }
          },
          required: ["subject", "body_text"],
          additionalProperties: false
        }
      }
    }
  });

  const { subject, body_text: bodyText } = JSON.parse(response.output_text) as { subject: string; body_text: string };

  await sendViaResend(to, subject, bodyText);

  const { error } = await supabaseAdmin
    .from("leads")
    .update({
      status: "outreach_sent",
      metadata: {
        ...(lead.metadata ?? {}),
        outreach_subject: subject,
        outreach_body: bodyText,
        outreach_sent_at: new Date().toISOString()
      }
    })
    .eq("id", lead.id);

  if (error) {
    throw new Error(`Failed to persist outreach state: ${error.message}`);
  }

  await writeAgentLog({
    leadId: lead.id,
    agent: "outreach",
    eventType: "outreach_sent",
    payload: { to, subject }
  });
}

async function sendViaResend(to: string, subject: string, bodyText: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required for outreach email delivery.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.OUTREACH_FROM_EMAIL,
      to,
      subject,
      text: bodyText
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend rejected email: ${text}`);
  }
}
