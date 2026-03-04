import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/agents/qualification-agent";
import { sendOutreachEmail } from "@/lib/agents/outreach-agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const leadId = String(body.leadId ?? "").trim();

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  await sendOutreachEmail(lead);

  return NextResponse.json({ sent: true, leadId });
}
