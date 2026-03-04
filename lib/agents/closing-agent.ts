import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead } from "@/lib/types";
import { writeAgentLog } from "@/lib/agents/logger";
import { createInvoicePaymentLink } from "@/lib/billing";

export async function processInboundReply(lead: Lead, replyText: string): Promise<{ interested: boolean; response: string }> {
  const classification = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Classify if this prospect reply shows buying intent for website redesign services. Return strict JSON with interested and reason."
      },
      {
        role: "user",
        content: JSON.stringify({
          company: lead.title,
          replyText
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "reply_classification",
        schema: {
          type: "object",
          properties: {
            interested: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["interested", "reason"],
          additionalProperties: false
        }
      }
    }
  });

  const parsed = JSON.parse(classification.output_text) as { interested: boolean; reason: string };

  if (!parsed.interested) {
    await supabaseAdmin.from("leads").update({ status: "rejected" }).eq("id", lead.id);
    await writeAgentLog({
      leadId: lead.id,
      agent: "closing",
      eventType: "reply_marked_not_interested",
      payload: parsed
    });
    return { interested: false, response: parsed.reason };
  }

  const fullDemoUrl = String(lead.redesign_full_url ?? (lead.metadata ?? {}).redesign_full_url ?? "");

  const invoiceUrl =
    lead.invoice_url ??
    (await createInvoicePaymentLink({
      leadId: lead.id,
      companyName: lead.title,
      amountUsd: 1995,
      description: "Custom premium multi-page website redesign and build",
      successUrl: "https://example.com/payment-success",
      cancelUrl: "https://example.com/payment-cancel"
    }));

  const followUp = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Write a concise sales reply sharing the complete redesign preview and invoice links after positive prospect intent. Return plain text only."
      },
      {
        role: "user",
        content: JSON.stringify({ company: lead.title, fullDemoUrl, invoiceUrl, replyText })
      }
    ]
  });

  const responseText = followUp.output_text.trim();

  await supabaseAdmin
    .from("leads")
    .update({
      status: "invoiced",
      invoice_url: invoiceUrl,
      metadata: {
        ...(lead.metadata ?? {}),
        latest_closing_reply: responseText,
        latest_reply_text: replyText
      }
    })
    .eq("id", lead.id);

  await writeAgentLog({
    leadId: lead.id,
    agent: "closing",
    eventType: "reply_marked_interested",
    payload: { classification: parsed, responseText }
  });

  return { interested: true, response: responseText };
}
