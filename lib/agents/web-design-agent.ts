import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { Lead } from "@/lib/types";
import { writeAgentLog } from "@/lib/agents/logger";

export async function createRedesignPreview(lead: Lead): Promise<{ blurUrl: string; fullUrl: string }> {
  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Create concise redesign messaging. Return JSON with hero_title, hero_subtitle, and differentiation_points (array of 3 short strings)."
      },
      {
        role: "user",
        content: JSON.stringify({
          company: lead.title,
          website: lead.website_url,
          description: lead.description,
          audience: "service business decision makers"
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "redesign_preview",
        schema: {
          type: "object",
          properties: {
            hero_title: { type: "string" },
            hero_subtitle: { type: "string" },
            differentiation_points: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["hero_title", "hero_subtitle", "differentiation_points"],
          additionalProperties: false
        }
      }
    }
  });

  const preview = JSON.parse(response.output_text) as {
    hero_title: string;
    hero_subtitle: string;
    differentiation_points: string[];
  };

  const fullSvg = buildSvg({
    company: lead.title,
    heroTitle: preview.hero_title,
    heroSubtitle: preview.hero_subtitle,
    points: preview.differentiation_points,
    blur: false
  });

  const blurredSvg = buildSvg({
    company: lead.title,
    heroTitle: preview.hero_title,
    heroSubtitle: preview.hero_subtitle,
    points: preview.differentiation_points,
    blur: true
  });

  const fullUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
  const blurUrl = `data:image/svg+xml;utf8,${encodeURIComponent(blurredSvg)}`;

  const { error } = await supabaseAdmin
    .from("leads")
    .update({
      redesign_blur_url: blurUrl,
      redesign_full_url: fullUrl,
      status: "proposal_sent",
      metadata: {
        ...(lead.metadata ?? {}),
        redesign_preview: preview
      }
    })
    .eq("id", lead.id);

  if (error) {
    throw new Error(`Failed to save redesign preview: ${error.message}`);
  }

  await writeAgentLog({
    leadId: lead.id,
    agent: "web_design",
    eventType: "redesign_preview_generated",
    payload: {
      heroTitle: preview.hero_title,
      blurUrlLength: blurUrl.length,
      fullUrlLength: fullUrl.length
    }
  });

  return { blurUrl, fullUrl };
}

export async function createDesignHandoff(lead: Lead): Promise<{ buildSpec: string }> {
  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "system",
        content:
          "Create a web build handoff spec with pages, components, CMS/blog needs, integrations, and acceptance criteria. Return markdown only."
      },
      {
        role: "user",
        content: JSON.stringify({
          company: lead.title,
          websiteUrl: lead.website_url,
          notes: lead.qualification_reasoning,
          status: lead.status
        })
      }
    ]
  });

  const buildSpec = response.output_text.trim();

  const { error } = await supabaseAdmin
    .from("projects")
    .upsert({
      lead_id: lead.id,
      name: `${lead.title} Website Redesign`,
      status: "in_progress",
      build_spec_md: buildSpec
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create project handoff: ${error.message}`);
  }

  await supabaseAdmin.from("leads").update({ status: "handoff_started" }).eq("id", lead.id);

  await writeAgentLog({
    leadId: lead.id,
    agent: "web_design",
    eventType: "handoff_created",
    payload: {
      buildSpecLength: buildSpec.length
    }
  });

  return { buildSpec };
}

function buildSvg(input: {
  company: string;
  heroTitle: string;
  heroSubtitle: string;
  points: string[];
  blur: boolean;
}): string {
  const listItems = input.points
    .map(
      (point, index) =>
        `<text x="70" y="${360 + index * 40}" font-size="24" fill="#f1f5ff" font-family="Space Grotesk">- ${escapeXml(point)}</text>`
    )
    .join("");

  const filter = input.blur ? `filter="url(#blur)"` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f1f4a"/>
      <stop offset="100%" stop-color="#381a3d"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="8" /></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" rx="28" />
  <text x="70" y="100" font-size="30" fill="#58d4ff" font-family="Space Grotesk">${escapeXml(input.company)} Redesign Preview</text>
  <g ${filter}>
    <text x="70" y="210" font-size="60" fill="#ffffff" font-family="Space Grotesk" font-weight="700">${escapeXml(input.heroTitle)}</text>
    <text x="70" y="280" font-size="28" fill="#d2dbf3" font-family="Space Grotesk">${escapeXml(input.heroSubtitle)}</text>
    ${listItems}
  </g>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
