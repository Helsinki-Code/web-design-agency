import { NextRequest, NextResponse } from "next/server";
import { runLeadResearch } from "@/lib/agents/lead-research-agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const objective = String(body.objective ?? "").trim();

  if (!objective) {
    return NextResponse.json({ error: "objective is required" }, { status: 400 });
  }

  const run = await runLeadResearch({
    objective,
    entityType: "companies",
    matchLimit: Number(body.matchLimit ?? 50)
  });

  return NextResponse.json(run);
}
