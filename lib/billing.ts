import { env } from "@/lib/env";

export async function createInvoicePaymentLink(input: {
  leadId: string;
  companyName: string;
  amountUsd: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required for invoice generation.");
  }

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", input.successUrl);
  params.append("cancel_url", input.cancelUrl);
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][unit_amount]", String(Math.round(input.amountUsd * 100)));
  params.append("line_items[0][price_data][product_data][name]", `${input.companyName} Website Redesign`);
  params.append("line_items[0][price_data][product_data][description]", input.description);
  params.append("line_items[0][quantity]", "1");
  params.append("metadata[lead_id]", input.leadId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stripe checkout session creation failed: ${body}`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Stripe response did not include checkout URL.");
  }

  return payload.url;
}
