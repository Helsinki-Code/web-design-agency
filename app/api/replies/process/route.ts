import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/agents/qualification-agent";
import { processInboundReply } from "@/lib/agents/closing-agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const leadId = String(body.leadId ?? "").trim();
  const replyText = String(body.replyText ?? "").trim();

  if (!leadId || !replyText) {
    return NextResponse.json({ error: "leadId and replyText are required" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  const result = await processInboundReply(lead, replyText);

  return NextResponse.json(result);
}
