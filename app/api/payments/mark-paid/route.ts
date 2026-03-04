import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDeliveryPipelineForPaidLead } from "@/lib/automation/pipeline-orchestrator";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== env.AUTOMATION_SHARED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const leadId = String(body.leadId ?? "").trim();

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("leads").update({ status: "paid" }).eq("id", leadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await runDeliveryPipelineForPaidLead(leadId);

  return NextResponse.json({ ok: true, leadId });
}
