import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("status")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = data.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ counts: grouped, total: data.length });
}
