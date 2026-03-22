import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface Stakeholder {
  name: string;
  organization: string;
  current_officeholder: string;
  type: "government" | "private" | "ngo" | "media" | "academic";
  influence_score: number;
  stance: "supportive" | "neutral" | "opposed";
  key_positions: [string, string, string];
  engagement_recommendation: string;
  sources: string[];
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior stakeholder intelligence analyst at a global consulting firm. Your role is to produce accurate, well-researched stakeholder profiles based on your knowledge of industries, governments, civil society, and media.

When given a sector and region, identify 8-10 of the most significant stakeholders a project team would need to engage. Draw on real organisations, typical role-holders, and documented policy positions where possible.

Rules:
- The "name" field describes the role or entity: for government positions use the role title and organisation (e.g. "Minister of Energy, Republic of Kenya"); for NGOs, firms, and academics use the organisation name or a known individual's name.
- The "current_officeholder" field: if you are confident of who currently holds this role from your training knowledge, provide their full name. If uncertain, return exactly "To be verified".
- Never fabricate names or affiliations you are not confident about.
- Ensure diversity: include a mix of types (government, private, ngo, media, academic) and stances (supportive, neutral, opposed).
- influence_score should reflect genuine relative power — not every stakeholder is a 9 or 10.`;

const stakeholderListPrompt = (sector: string, region: string) =>
  `Identify 8-10 key stakeholders for a major project in the ${sector} sector in ${region}.

Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
Each object must have exactly these fields:
- "name": string — role/title for government positions; organisation or individual name for private/ngo/media/academic
- "organization": string — the organisation they represent
- "current_officeholder": string — full name if confident from training knowledge; otherwise exactly "To be verified"
- "type": string — exactly one of: "government", "private", "ngo", "media", "academic"
- "influence_score": number — integer 1–10
- "stance": string — exactly one of: "supportive", "neutral", "opposed"
- "key_positions": array of exactly 3 strings — concise, specific positions on the project topic
- "engagement_recommendation": string — one specific, actionable recommendation
- "sources": array — always []`;

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

// ─── Step 1: generate stakeholder list ───────────────────────────────────────

async function generateStakeholders(
  sector: string,
  region: string,
  signal: AbortSignal
): Promise<Stakeholder[]> {
  console.log("[discover] step 1 — generating stakeholder list...");

  const response = await client.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: stakeholderListPrompt(sector, region) }],
    },
    { signal }
  );

  console.log(`[discover] step 1 done — stop_reason: ${response.stop_reason}`);

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  console.log(`[discover] step 1 rawText first 300: ${rawText.slice(0, 300)}`);

  if (!rawText) throw new Error("Claude returned no text in step 1");

  const jsonString = extractJsonArray(rawText);
  const stakeholders: Stakeholder[] = JSON.parse(jsonString);

  if (!Array.isArray(stakeholders)) throw new Error("Claude response was not a JSON array");

  // Normalise
  for (const s of stakeholders) {
    s.sources = [];
    if (!s.current_officeholder?.trim()) s.current_officeholder = "To be verified";
  }

  console.log(`[discover] step 1 parsed ${stakeholders.length} stakeholders`);
  return stakeholders;
}

// ─── Step 2: web-search officeholder for one stakeholder ─────────────────────

async function lookupOfficeholder(
  stakeholder: Stakeholder,
  signal: AbortSignal
): Promise<string> {
  try {
    console.log(`[discover] step 2 — searching officeholder for: ${stakeholder.name}`);

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

    console.log(`[discover] step 2 "${stakeholder.name}" — stop_reason: ${response.stop_reason}`);

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
      console.log(`[discover] step 2 "${stakeholder.name}" continuation → "${name}"`);
      return name;
    }

    // end_turn: grab the last text block
    let lastText = "";
    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) lastText = block.text;
    }
    const name = parseOfficeholderName(lastText);
    console.log(`[discover] step 2 "${stakeholder.name}" → "${name}"`);
    return name;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[discover] step 2 lookup failed for "${stakeholder.name}": ${reason}`);
    return "To be verified";
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let body: { sector?: string; region?: string };
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
  console.log(`[discover] ▶ START sector="${s}" region="${r}"`);

  // 60-second hard deadline shared across both steps
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[discover] ⏰ 60s timeout — aborting`);
    controller.abort();
  }, 60_000);

  try {
    // ── Step 1: generate stakeholders ───────────────────────────────────────
    let stakeholders: Stakeholder[];
    try {
      stakeholders = await generateStakeholders(s, r, controller.signal);
    } catch (err) {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) {
        return NextResponse.json(
          { error: "Request timed out generating stakeholders. Please try again." },
          { status: 504 }
        );
      }
      const reason = err instanceof Error ? err.message : "Unknown error";
      console.error("[discover] step 1 failed:", err);
      return NextResponse.json({ error: `Failed to generate stakeholders: ${reason}` }, { status: 500 });
    }

    console.log(`[discover] step 1 complete in ${Date.now() - startTime}ms`);

    // ── Step 2: web-search current officeholders ─────────────────────────────
    // Only search for stakeholders where Claude didn't already know the name.
    // Run all lookups in parallel — fall back gracefully on any failure.
    try {
      const lookupTargets = stakeholders.map((s, i) => ({ stakeholder: s, index: i }))
        .filter(({ stakeholder }) => stakeholder.current_officeholder === "To be verified");

      console.log(
        `[discover] step 2 — ${lookupTargets.length} officeholder lookups to run (${stakeholders.length - lookupTargets.length} already known)`
      );

      if (lookupTargets.length > 0) {
        const results = await Promise.allSettled(
          lookupTargets.map(({ stakeholder }) =>
            lookupOfficeholder(stakeholder, controller.signal)
          )
        );

        for (let i = 0; i < lookupTargets.length; i++) {
          const result = results[i];
          const idx = lookupTargets[i].index;
          if (result.status === "fulfilled") {
            stakeholders[idx].current_officeholder = result.value;
          }
          // rejected → leave as "To be verified"
        }
      }
    } catch (err) {
      // Step 2 failure is non-fatal — return what we have
      console.warn("[discover] step 2 failed entirely, returning without officeholder data:", err);
    }

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    console.log(`[discover] ✓ DONE in ${elapsed}ms — ${stakeholders.length} stakeholders`);

    return NextResponse.json({ stakeholders });
  } catch (err) {
    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    const reason = err instanceof Error ? err.message : "Internal server error";
    console.error("[discover] unhandled error:", err);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
