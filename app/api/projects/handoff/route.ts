import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/agents/qualification-agent";
import { createDesignHandoff } from "@/lib/agents/web-design-agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const leadId = String(body.leadId ?? "").trim();

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  const result = await createDesignHandoff(lead);

  return NextResponse.json(result);
}
