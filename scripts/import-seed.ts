import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { supabaseAdmin } from "@/lib/supabase";

interface CsvLeadRow {
  title?: string;
  description?: string;
  url?: string;
  company_email?: string;
  company_phone_number?: string;
  company_website_url?: string;
  decision_maker_name?: string;
  decision_maker_title?: string;
  decision_maker_email?: string;
  decision_maker_linkedin_url?: string;
  employee_count?: string;
  decision_maker_linkedin_profile_complete_analysis?: string;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const csvPath = join(root, "..", "parallel", "enrich_results.csv");
  const content = await readFile(csvPath, "utf-8");

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true
  }) as CsvLeadRow[];

  const payload = rows.map((row) => ({
    title: (row.title ?? "").trim() || "Unnamed Business",
    description: row.description ?? null,
    website_url: row.company_website_url ?? row.url ?? "",
    company_email: row.company_email ?? null,
    company_phone: row.company_phone_number ?? null,
    decision_maker_name: row.decision_maker_name ?? null,
    decision_maker_title: row.decision_maker_title ?? null,
    decision_maker_email: row.decision_maker_email ?? null,
    decision_maker_linkedin_url: row.decision_maker_linkedin_url ?? null,
    employee_count: row.employee_count ?? null,
    status: "discovered",
    metadata: {
      csv_source: "parallel/enrich_results.csv",
      linkedin_analysis: row.decision_maker_linkedin_profile_complete_analysis ?? null
    }
  }));

  const { error } = await supabaseAdmin.from("leads").upsert(payload, {
    onConflict: "title,website_url"
  });

  if (error) {
    throw new Error(`Seed import failed: ${error.message}`);
  }

  console.log(`Imported ${payload.length} rows from ${csvPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
