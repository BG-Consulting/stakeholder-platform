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
- The "coordinates" field: provide approximate [longitude, latitude] coordinates for the stakeholder's office or presence IN THE PROJECT REGION, not their global headquarters. For example, UNICEF Sierra Leone should use Freetown coordinates [−13.23, 8.48], not New York. WHO Lebanon should use Beirut [35.50, 33.89], not Geneva. Only use global headquarters coordinates if the organization has no local office or presence in the project region.`;

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
- "sources": array — always []`;

const batch1Prompt = (sector: string, region: string) =>
  `Identify 10-12 of the MOST IMPORTANT stakeholders for a major project in the ${sector} sector in ${region}.

Focus on the highest-influence, most critical stakeholders across these categories:
1. Government & Regulatory (key national ministries, top regulators)
2. Private Sector (major corporations, leading industry associations)
3. Civil Society & NGOs (prominent advocacy groups)
4. Media & Communications (major national press)
5. Academic & Research (top universities, leading think tanks)
6. International Organizations & Donors (major UN agencies, development banks)

Cover at least 4-5 different categories. Prioritise the stakeholders with the highest influence and most direct relevance.

Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${FIELD_SCHEMA}`;

const batch2Prompt = (sector: string, region: string, existingNames: string[]) =>
  `You have already identified these stakeholders for a major project in the ${sector} sector in ${region}:
${existingNames.map((n) => `- ${n}`).join("\n")}

Now identify 10-12 ADDITIONAL stakeholders that are NOT in the list above. Focus on:
- Lesser-known regional and local actors (municipal authorities, regional trade bodies, local civil society groups)
- Community media and specialised trade publications
- Regional research institutes and smaller academic players
- Smaller bilateral donors, embassy programmes, and regional international organisations
- Local private sector players and emerging companies
- Grassroots NGOs and community organisations

Ensure coverage of any categories underrepresented in the existing list, especially:
1. Government & Regulatory (local/municipal level)
2. Private Sector (local businesses, SME associations)
3. Civil Society & NGOs (grassroots, community-level)
4. Media & Communications (regional/community media)
5. Academic & Research (regional institutes)
6. International Organizations & Donors (bilateral donors, smaller agencies)

Do NOT duplicate any stakeholder from the existing list above.

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

/** Sanitise the raw text returned by the officeholder lookup. */
function parseOfficeholderName(raw: string): string {
  const text = raw.trim();
  // Reject anything that looks like a sentence rather than a name
  if (!text || text.length > 80 || text.includes("\n") || text.split(" ").length > 6) {
    return "To be verified";
  }
  return text;
}

// ─── Generate stakeholder list ───────────────────────────────────────────────

async function generateStakeholders(
  sector: string,
  region: string,
  batch: 1 | 2,
  existingNames: string[],
  signal: AbortSignal
): Promise<Stakeholder[]> {
  console.log(`[discover] batch ${batch} — generating stakeholder list...`);

  const userPrompt = batch === 1
    ? batch1Prompt(sector, region)
    : batch2Prompt(sector, region, existingNames);

  const response = await client.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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

  // Normalise
  for (const s of stakeholders) {
    s.sources = [];
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

    // If server is mid-search (pause_turn), do one continuation
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

    // end_turn: grab the last text block
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

  let body: { sector?: string; region?: string; batch?: number; existingNames?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sector, region } = body;
  if (!sector?.trim() || !region?.trim()) {
    return NextResponse.json({ error: "sector and region are required" }, { status: 400 });
  }

  const s = sector.trim();
  const r = region.trim();
  const batch = (body.batch === 1 || body.batch === 2) ? body.batch : 1;
  const existingNames = Array.isArray(body.existingNames) ? body.existingNames : [];

  console.log(`[discover] ▶ START batch=${batch} sector="${s}" region="${r}" existing=${existingNames.length}`);

  // 60-second timeout per batch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[discover] ⏰ 60s timeout — aborting batch ${batch}`);
    controller.abort();
  }, 60_000);

  try {
    // ── Generate stakeholders ────────────────────────────────────────────
    let stakeholders: Stakeholder[];
    try {
      stakeholders = await generateStakeholders(s, r, batch, existingNames, controller.signal);
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

    // ── Web-search current officeholders ──────────────────────────────────
    try {
      await resolveOfficeholders(stakeholders, controller.signal);
    } catch (err) {
      console.warn(`[discover] batch ${batch} officeholder lookups failed, returning without:`, err);
    }

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
