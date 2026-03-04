import { NextRequest, NextResponse } from "next/server";
import { syncFindAllToLeads } from "@/lib/agents/lead-research-agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const findallId = String(body.findallId ?? "").trim();

  if (!findallId) {
    return NextResponse.json({ error: "findallId is required" }, { status: 400 });
  }

  const result = await syncFindAllToLeads(findallId);
  return NextResponse.json(result);
}
