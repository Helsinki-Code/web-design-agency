import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  runDiscoveryCycle,
  runOutreachBatch,
  runQualificationBatch
} from "@/lib/automation/pipeline-orchestrator";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== env.AUTOMATION_SHARED_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mode = String(body.mode ?? "full");

    if (mode === "discovery") {
      const objective = String(
        body.objective ??
          "Find service businesses in the United States with outdated websites and available contact channels."
      );

      const result = await runDiscoveryCycle(objective);
      return NextResponse.json({ mode, ...result });
    }

    if (mode === "qualification") {
      const result = await runQualificationBatch(Number(body.limit ?? 25));
      return NextResponse.json({ mode, ...result });
    }

    if (mode === "outreach") {
      const result = await runOutreachBatch(Number(body.limit ?? 25));
      return NextResponse.json({ mode, ...result });
    }

    const discovery = await runDiscoveryCycle(
      String(
        body.objective ??
          "Find service businesses in the United States with outdated websites and available contact channels."
      )
    );
    const qualification = await runQualificationBatch(Number(body.qualificationLimit ?? 25));
    const outreach = await runOutreachBatch(Number(body.outreachLimit ?? 25));

    return NextResponse.json({ mode: "full", discovery, qualification, outreach });
  } catch (error) {
    const message = error instanceof Error ? error.message : "automation_run_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
