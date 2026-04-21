import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 90;

const client = new Anthropic();

export type StakeholderCategory =
  | "Government & Regulatory"
  | "Private Sector"
  | "Civil Society & NGOs"
  | "Media & Communications"
  | "Academic & Research"
  | "International Organizations & Donors";

export interface Stakeholder {
  name: string;
  organization: string;
  current_officeholder: string;
  type: "government" | "private" | "ngo" | "media" | "academic" | "international";
  category: StakeholderCategory;
  influence_score: number;
  stance: "supportive" | "neutral" | "opposed";
  key_positions: [string, string, string];
  engagement_recommendation: string;
  contact: string;
  coordinates: [number, number];
  sources: string[];
  source_years: (number | null)[];   // publication year per source, null if unknown
  generated_date: string;            // ISO date string — when this profile was generated
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior stakeholder intelligence analyst at a global consulting firm. Your role is to produce accurate, well-researched stakeholder profiles based on your knowledge of industries, governments, civil society, and media.

Rules:
- The "name" field describes the role or entity: for government positions use the role title and organisation (e.g. "Minister of Energy, Republic of Kenya"); for NGOs, firms, and academics use the organisation name or a known individual's name.
- The "current_officeholder" field: ALWAYS provide the most recently known officeholder name from your training knowledge, even if the information might be slightly dated. For well-known government ministries, international organizations, major NGOs, and prominent institutions you should always be able to provide a name. Only use "To be verified" for very obscure or minor roles where you genuinely have no knowledge at all.
- Never fabricate names — but do not be overly cautious. If you know who held the role as of your last training data, provide that name.
- Each stakeholder MUST have a "category" field set to exactly one of: "Government & Regulatory", "Private Sector", "Civil Society & NGOs", "Media & Communications", "Academic & Research", "International Organizations & Donors".
- Ensure diversity of stances (supportive, neutral, opposed) across the full set.
- influence_score should reflect genuine relative power — not every stakeholder is a 9 or 10.
- The "contact" field: provide a publicly known official contact email or official website contact page URL for the organisation. If no specific email is known, provide the organisation's official website URL. NEVER fabricate email addresses — if unsure, use the official website URL.
- The "coordinates" field: provide approximate [longitude, latitude] coordinates for the stakeholder's office or presence IN THE PROJECT REGION, not their global headquarters.
- The "sources" field: provide 2-4 real, publicly accessible URLs that were used to inform this profile. These should be the organisation's official website, a government directory page, a known news article, or a credible database entry. NEVER fabricate URLs — only include URLs you are confident exist.
- The "source_years" field: for each URL in "sources", provide the publication or last-updated year as an integer (e.g. 2023), or null if unknown. This array must be the same length as "sources".`;

const FIELD_SCHEMA = `Each object must have exactly these fields:
- "name": string — role/title for government positions; organisation or individual name for private/ngo/media/academic/international
- "organization": string — the organisation they represent
- "current_officeholder": string — full name if confident from training knowledge; otherwise exactly "To be verified"
- "type": string — exactly one of: "government", "private", "ngo", "media", "academic", "international"
- "category": string — exactly one of: "Government & Regulatory", "Private Sector", "Civil Society & NGOs", "Media & Communications", "Academic & Research", "International Organizations & Donors"
- "influence_score": number — integer 1–10
- "stance": string — exactly one of: "supportive", "neutral", "opposed"
- "key_positions": array of exactly 3 strings — concise, specific positions on the project topic
- "engagement_recommendation": string — one specific, actionable recommendation
- "contact": string — publicly known official email or website contact URL for the organisation; use official website URL if no email is known; NEVER fabricate emails
- "coordinates": array of exactly 2 numbers — [longitude, latitude] of the stakeholder's primary office location (city-level precision)
- "sources": array of 2-4 strings — real publicly accessible URLs for the organisation's official website, government directory, or credible reference pages; NEVER fabricate URLs
- "source_years": array of integers or nulls — publication or last-updated year for each source URL (same length as sources array); use null if unknown`;

const existing = (names: string[]) =>
  `You have already identified these stakeholders:\n${names.map(n => `- ${n}`).join("\n")}\n\nDo NOT duplicate any of them.\n\n`;

const objectivesClause = (objectives?: string) =>
  objectives?.trim() ? `\n\nProject Objectives: ${objectives.trim()}\nEnsure all stakeholders are directly relevant to these objectives.` : "";

const batch1Prompt = (sector: string, region: string, objectives?: string) =>
  `Identify 8-10 of the MOST IMPORTANT national-level and international stakeholders for a major project in the ${sector} sector in ${region}.${objectivesClause(objectives)}

Focus exclusively on:
1. Government & Regulatory — key national ministries, cabinet-level officials, top regulators, parliamentary committees
2. International Organizations & Donors — major UN agencies, World Bank, IMF, regional development banks, bilateral aid programmes
3. Civil Society & NGOs — the most prominent national-level advocacy organisations

Return 8-10 stakeholders. Cover all 3 categories above.
Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const batch2Prompt = (sector: string, region: string, existingNames: string[], objectives?: string) =>
  `${existing(existingNames)}Now identify 8-10 ADDITIONAL stakeholders for a major project in the ${sector} sector in ${region}.${objectivesClause(objectives)}

Focus exclusively on:
1. Private Sector — major corporations, leading industry associations, chambers of commerce at national level
2. Academic & Research — top universities, leading think tanks, national research institutes relevant to ${sector}
3. Media & Communications — major national newspapers, TV channels, influential online media, sector-specific publications

Return 8-10 stakeholders. Cover all 3 categories above.
Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const batch3Prompt = (sector: string, region: string, existingNames: string[], objectives?: string) =>
  `${existing(existingNames)}Now identify 8-10 ADDITIONAL stakeholders for a major project in the ${sector} sector in ${region}.${objectivesClause(objectives)}

Focus exclusively on LOCAL AND REGIONAL actors — go deep into sub-national level:
1. Government & Regulatory — municipal authorities, district/provincial governments, local regulatory bodies, local elected officials
2. Civil Society & NGOs — local and community-based NGOs, grassroots organisations, local advocacy groups, community associations
3. International Organizations & Donors — smaller bilateral donors, embassy development programmes, regional funds, smaller UN country offices

These should be less well-known actors operating at local/community level, NOT the major national organisations already identified.
Return 8-10 stakeholders.
Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const batch4Prompt = (sector: string, region: string, existingNames: string[], objectives?: string) =>
  `${existing(existingNames)}Now identify 8-10 ADDITIONAL stakeholders for a major project in the ${sector} sector in ${region}.${objectivesClause(objectives)}

Focus exclusively on INFORMAL INFLUENCERS AND COMMUNITY VOICES — actors who may not have formal institutional power but shape opinion and implementation:
1. Religious leaders, traditional leaders, community elders with influence over the ${sector} sector
2. Diaspora organisations and networks with influence in ${region}
3. Local and community radio, community newspapers, bloggers, social media influencers relevant to ${sector}
4. Grassroots women's groups, youth organisations, disability groups, minority community representatives
5. Professional associations (lawyers, doctors, engineers, teachers) relevant to ${sector}

These should be genuine community-level voices not yet identified. Be specific and name real organisations or known roles.
Return 8-10 stakeholders.
Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const batch5Prompt = (sector: string, region: string, existingNames: string[], objectives?: string) =>
  `${existing(existingNames)}Now identify 8-10 ADDITIONAL stakeholders for a major project in the ${sector} sector in ${region}.${objectivesClause(objectives)}

Focus exclusively on LOCAL ECONOMIC ACTORS AND LABOUR:
1. Local SMEs and small business associations operating in the ${sector} space
2. Trade unions, labour federations, and worker organisations relevant to ${sector}
3. Local investors, microfinance institutions, local banks financing ${sector} activities
4. Cooperatives, producer groups, farmer associations, artisan groups relevant to ${sector}
5. Local contractors, suppliers, and service providers in the ${sector} supply chain

These should be economic actors at the base of the pyramid — not the major corporations already identified.
Return 8-10 stakeholders.
Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const officeholderLookupPrompt = (role: string, organization: string) =>
  `Search the web for who is currently the "${role}" at "${organization}".
Return ONLY the person's full name — nothing else, no explanation, no punctuation.
If you cannot find a confirmed answer, return exactly: To be verified`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJsonArray(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function parseOfficeholderName(raw: string): string {
  const text = raw.trim();
  if (!text || text.length > 80 || text.includes("\n") || text.split(" ").length > 6) {
    return "To be verified";
  }
  return text;
}

// ─── Generate stakeholder list ───────────────────────────────────────────────

async function generateStakeholders(
  sector: string,
  region: string,
  batch: 1 | 2 | 3 | 4 | 5,
  existingNames: string[],
  signal: AbortSignal,
  objectives?: string
): Promise<Stakeholder[]> {
  console.log(`[discover] batch ${batch} — generating stakeholder list...`);

  const userPrompt =
    batch === 1 ? batch1Prompt(sector, region, objectives) :
    batch === 2 ? batch2Prompt(sector, region, existingNames, objectives) :
    batch === 3 ? batch3Prompt(sector, region, existingNames, objectives) :
    batch === 4 ? batch4Prompt(sector, region, existingNames, objectives) :
                  batch5Prompt(sector, region, existingNames, objectives);

  const response = await client.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    },
    { signal }
  );

  console.log(`[discover] batch ${batch} done — stop_reason: ${response.stop_reason}`);

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  console.log(`[discover] batch ${batch} rawText first 300: ${rawText.slice(0, 300)}`);

  if (!rawText) throw new Error(`Claude returned no text in batch ${batch}`);

  const jsonString = extractJsonArray(rawText);
  const stakeholders: Stakeholder[] = JSON.parse(jsonString);

  if (!Array.isArray(stakeholders)) throw new Error("Claude response was not a JSON array");

  const today = new Date().toISOString().slice(0, 10);

  // Normalise — do NOT wipe sources; validate and keep them
  for (const s of stakeholders) {
    // Keep sources returned by Claude; filter out any that are clearly invalid
    if (!Array.isArray(s.sources)) {
      s.sources = [];
    } else {
      s.sources = s.sources.filter(
        (src) => typeof src === "string" && src.startsWith("http") && src.length > 10
      );
    }

    // Keep source_years; pad or trim to match sources length
    if (!Array.isArray(s.source_years)) {
      s.source_years = s.sources.map(() => null);
    } else {
      // Ensure same length as sources
      while (s.source_years.length < s.sources.length) s.source_years.push(null);
      s.source_years = s.source_years.slice(0, s.sources.length);
    }

    // Always stamp the generation date
    s.generated_date = today;

    if (!s.current_officeholder?.trim()) s.current_officeholder = "To be verified";
    if (!s.contact?.trim()) s.contact = "";
    if (!s.category) s.category = "Government & Regulatory";
    if (!Array.isArray(s.coordinates) || s.coordinates.length !== 2) s.coordinates = [0, 0];
  }

  console.log(`[discover] batch ${batch} parsed ${stakeholders.length} stakeholders`);
  return stakeholders;
}

// ─── Web-search officeholder for one stakeholder ─────────────────────────────

async function lookupOfficeholder(
  stakeholder: Stakeholder,
  signal: AbortSignal
): Promise<string> {
  try {
    console.log(`[discover] officeholder search for: ${stakeholder.name}`);

    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content: officeholderLookupPrompt(stakeholder.name, stakeholder.organization),
          },
        ],
      },
      { signal }
    );

    console.log(`[discover] officeholder "${stakeholder.name}" — stop_reason: ${response.stop_reason}`);

    if (response.stop_reason === "pause_turn") {
      const cont = await client.messages.create(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 256,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            {
              role: "user",
              content: officeholderLookupPrompt(stakeholder.name, stakeholder.organization),
            },
            {
              role: "assistant",
              content: response.content as unknown as Anthropic.ContentBlockParam[],
            },
          ],
        },
        { signal }
      );
      const textBlock = cont.content.find((b) => b.type === "text");
      const raw = textBlock?.type === "text" ? textBlock.text : "";
      const name = parseOfficeholderName(raw);
      console.log(`[discover] officeholder "${stakeholder.name}" continuation → "${name}"`);
      return name;
    }

    let lastText = "";
    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) lastText = block.text;
    }
    const name = parseOfficeholderName(lastText);
    console.log(`[discover] officeholder "${stakeholder.name}" → "${name}"`);
    return name;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[discover] officeholder lookup failed for "${stakeholder.name}": ${reason}`);
    return "To be verified";
  }
}

// ─── Run officeholder lookups for a batch ────────────────────────────────────

async function resolveOfficeholders(
  stakeholders: Stakeholder[],
  signal: AbortSignal
): Promise<void> {
  const lookupTargets = stakeholders
    .map((s, i) => ({ stakeholder: s, index: i }))
    .filter(({ stakeholder }) => stakeholder.current_officeholder === "To be verified");

  console.log(
    `[discover] officeholder lookups: ${lookupTargets.length} to search (${stakeholders.length - lookupTargets.length} already known)`
  );

  if (lookupTargets.length === 0) return;

  const results = await Promise.allSettled(
    lookupTargets.map(({ stakeholder }) =>
      lookupOfficeholder(stakeholder, signal)
    )
  );

  for (let i = 0; i < lookupTargets.length; i++) {
    const result = results[i];
    const idx = lookupTargets[i].index;
    if (result.status === "fulfilled") {
      stakeholders[idx].current_officeholder = result.value;
    }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let body: { sector?: string; region?: string; objectives?: string; batch?: number; existingNames?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sector, region, objectives } = body;
  if (!sector?.trim() || !region?.trim()) {
    return NextResponse.json({ error: "sector and region are required" }, { status: 400 });
  }

  const s = sector.trim();
  const r = region.trim();
  const o = objectives?.trim();
  const batchNum = body.batch;
  const batch: 1 | 2 | 3 | 4 | 5 =
    batchNum === 1 ? 1 :
    batchNum === 2 ? 2 :
    batchNum === 3 ? 3 :
    batchNum === 4 ? 4 :
    batchNum === 5 ? 5 : 1;
  const existingNames = Array.isArray(body.existingNames) ? body.existingNames : [];

  console.log(`[discover] ▶ START batch=${batch} sector="${s}" region="${r}" existing=${existingNames.length}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[discover] ⏰ 85s timeout — aborting batch ${batch}`);
    controller.abort();
  }, 85_000);

  try {
    let stakeholders: Stakeholder[];
    try {
      stakeholders = await generateStakeholders(s, r, batch, existingNames, controller.signal, o);
    } catch (err) {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) {
        return NextResponse.json(
          { error: "Request timed out generating stakeholders. Please try again." },
          { status: 504 }
        );
      }
      const reason = err instanceof Error ? err.message : "Unknown error";
      console.error(`[discover] batch ${batch} generation failed:`, err);
      return NextResponse.json({ error: `Failed to generate stakeholders: ${reason}` }, { status: 500 });
    }

    console.log(`[discover] batch ${batch} generated in ${Date.now() - startTime}ms`);

    // Officeholder web-search lookups disabled to prevent timeouts on large regions
    // current_officeholder is already populated by the main generation prompt
    // try {
    //   await resolveOfficeholders(stakeholders, controller.signal);
    // } catch (err) {
    //   console.warn(`[discover] batch ${batch} officeholder lookups failed, returning without:`, err);
    // }

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    console.log(`[discover] ✓ batch ${batch} DONE in ${elapsed}ms — ${stakeholders.length} stakeholders`);

    return NextResponse.json({ stakeholders, batch });
  } catch (err) {
    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    const reason = err instanceof Error ? err.message : "Internal server error";
    console.error(`[discover] batch ${batch} unhandled error:`, err);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
