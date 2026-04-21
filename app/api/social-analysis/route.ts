import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 90;

const client = new Anthropic();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StakeholderMediaProfile {
  name: string;
  organization: string;
  mention_volume: "High" | "Medium" | "Low" | "Minimal";
  sentiment: "Positive" | "Neutral" | "Negative" | "Mixed";
  key_narratives: string[];
  platforms: string[];
  notable_coverage: string;
}

export interface TopicLink {
  topic: string;
  strength: "Strong" | "Moderate" | "Weak";
  description: string;
}

export interface Narrative {
  theme: string;
  framing: "Administrative" | "Political" | "Crisis" | "Positive" | "Neutral";
  frequency: "High" | "Medium" | "Low";
  description: string;
}

export interface PlatformData {
  platform: string;
  share_pct: number;
  sentiment: "Positive" | "Neutral" | "Negative" | "Mixed";
  notes: string;
}

export interface SocialAnalysisResult {
  // Meta
  sector: string;
  region: string;
  objectives?: string;
  generated_date: string;
  time_window: string;
  data_source: "live" | "simulated";

  // Topic-level
  total_estimated_mentions: number;
  sentiment_breakdown: { positive: number; neutral: number; negative: number };
  volume_trend: { period: string; volume: "High" | "Medium" | "Low"; note: string }[];
  platform_breakdown: PlatformData[];
  key_narratives: Narrative[];
  topic_links: TopicLink[];
  influential_actors: { name: string; type: string; reach: string; stance: string }[];
  public_engagement_summary: string;
  risk_signals: string[];
  opportunities: string[];
  overall_summary: string;

  // Per-stakeholder
  stakeholder_profiles: StakeholderMediaProfile[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior media intelligence analyst specialising in social listening, reputation monitoring, and public discourse analysis. Your role is to produce structured, evidence-based social media and media coverage analyses.

You analyse media landscapes across traditional news, online publications, and social media platforms (Facebook, X/Twitter, Instagram, YouTube, LinkedIn) to identify narratives, sentiment patterns, influential actors, and topic linkages.

When web search data is available, synthesise it into structured intelligence. When you must rely on training knowledge, clearly indicate this is a knowledge-based simulation rather than live monitoring data.

Always be specific and concrete — name real organisations, media outlets, platforms, and observable trends rather than generic statements.`;

// ─── Helper: extract text from search response ───────────────────────────────

function extractSearchText(content: Anthropic.ContentBlock[]): string {
  return content
    .map(block => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_result") {
        return (block.content as Anthropic.ContentBlock[])
          ?.filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map(b => b.text)
          .join("\n") ?? "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// ─── Run web search query ─────────────────────────────────────────────────────

async function runSearch(query: string, signal: AbortSignal): Promise<string> {
  try {
    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: `Search for: ${query}\n\nSummarise the key findings in 300 words.` }],
      },
      { signal }
    );

    // If pause_turn, do one continuation
    if (response.stop_reason === "pause_turn") {
      const cont = await client.messages.create(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            { role: "user", content: `Search for: ${query}\n\nSummarise the key findings in 300 words.` },
            { role: "assistant", content: response.content as unknown as Anthropic.ContentBlockParam[] },
          ],
        },
        { signal }
      );
      return extractSearchText(cont.content);
    }

    return extractSearchText(response.content);
  } catch (err) {
    console.warn(`[social-analysis] Search failed for query "${query}":`, err);
    return "";
  }
}

// ─── Main synthesis ───────────────────────────────────────────────────────────

async function synthesiseAnalysis(
  sector: string,
  region: string,
  objectives: string | undefined,
  stakeholderNames: string[],
  searchResults: string[],
  isLive: boolean,
  signal: AbortSignal
): Promise<SocialAnalysisResult> {

  const searchContext = searchResults.filter(Boolean).length > 0
    ? `\n\nWEB SEARCH FINDINGS:\n${searchResults.filter(Boolean).join("\n\n---\n\n")}`
    : "\n\nNo live search data available — base analysis on training knowledge.";

  const stakeholderList = stakeholderNames.slice(0, 20).join(", ");

  const prompt = `Produce a comprehensive social media and media intelligence analysis for the following:

Sector: ${sector}
Region: ${region}
${objectives ? `Objectives: ${objectives}` : ""}
Key Stakeholders: ${stakeholderList}
Time Window: Last 6 months
${searchContext}

Return ONLY a valid JSON object — no markdown, no code fences, no prose.

The JSON must have exactly this structure:
{
  "total_estimated_mentions": <number>,
  "sentiment_breakdown": { "positive": <0-100>, "neutral": <0-100>, "negative": <0-100> },
  "volume_trend": [
    { "period": "Month 6 ago", "volume": "Low|Medium|High", "note": "brief note" },
    { "period": "Month 5 ago", "volume": "Low|Medium|High", "note": "brief note" },
    { "period": "Month 4 ago", "volume": "Low|Medium|High", "note": "brief note" },
    { "period": "Month 3 ago", "volume": "Low|Medium|High", "note": "brief note" },
    { "period": "Month 2 ago", "volume": "Low|Medium|High", "note": "brief note" },
    { "period": "Last month", "volume": "Low|Medium|High", "note": "brief note" }
  ],
  "platform_breakdown": [
    { "platform": "name", "share_pct": <number>, "sentiment": "Positive|Neutral|Negative|Mixed", "notes": "brief" }
  ],
  "key_narratives": [
    { "theme": "title", "framing": "Administrative|Political|Crisis|Positive|Neutral", "frequency": "High|Medium|Low", "description": "2-3 sentences" }
  ],
  "topic_links": [
    { "topic": "name", "strength": "Strong|Moderate|Weak", "description": "1 sentence" }
  ],
  "influential_actors": [
    { "name": "name", "type": "Media|Government|NGO|Academic|Individual|Platform", "reach": "High|Medium|Low", "stance": "Supportive|Neutral|Critical" }
  ],
  "public_engagement_summary": "2-3 paragraph summary of public engagement patterns",
  "risk_signals": ["signal 1", "signal 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "overall_summary": "3-4 paragraph executive summary of the media landscape",
  "stakeholder_profiles": [
    {
      "name": "stakeholder name",
      "organization": "org",
      "mention_volume": "High|Medium|Low|Minimal",
      "sentiment": "Positive|Neutral|Negative|Mixed",
      "key_narratives": ["narrative 1", "narrative 2"],
      "platforms": ["Facebook", "Twitter"],
      "notable_coverage": "1-2 sentences on notable coverage"
    }
  ]
}

Include stakeholder_profiles for the top 10 most media-relevant stakeholders from this list: ${stakeholderList}.
Make all data specific to ${sector} in ${region}. Use real media outlets, platforms, and observable trends.
The sentiment_breakdown numbers must sum to 100.
Platform share_pct values must sum to 100.`;

  const response = await client.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    },
    { signal }
  );

  const textBlock = response.content.find(b => b.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  // Extract JSON
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1].trim() : (() => {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    return start !== -1 && end !== -1 ? rawText.slice(start, end + 1) : rawText;
  })();

  const parsed = JSON.parse(jsonStr);

  return {
    ...parsed,
    sector,
    region,
    objectives,
    generated_date: new Date().toISOString().slice(0, 10),
    time_window: "Last 6 months",
    data_source: isLive ? "live" : "simulated",
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    sector?: string;
    region?: string;
    objectives?: string;
    stakeholders?: { name: string; organization: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sector, region, objectives, stakeholders = [] } = body;

  if (!sector?.trim() || !region?.trim()) {
    return NextResponse.json({ error: "sector and region are required" }, { status: 400 });
  }

  const s = sector.trim();
  const r = region.trim();
  const o = objectives?.trim();
  const stakeholderNames = stakeholders.map(st => st.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 85_000);

  try {
    // Web searches skipped to stay within timeout — using AI knowledge synthesis
    const searchResults: string[] = [];
    const isLive = false;

    console.log(`[social-analysis] Starting AI synthesis for ${s} in ${r}`);

    // ── Synthesise analysis ────────────────────────────────────────────
    const analysis = await synthesiseAnalysis(
      s, r, o, stakeholderNames, searchResults, isLive, controller.signal
    );

    clearTimeout(timeoutId);
    console.log(`[social-analysis] Analysis complete — data_source: ${analysis.data_source}`);

    return NextResponse.json({ analysis });

  } catch (err) {
    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      return NextResponse.json({ error: "Analysis timed out. Please try again." }, { status: 504 });
    }

    const reason = err instanceof Error ? err.message : "Internal server error";
    console.error("[social-analysis] Error:", err);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
