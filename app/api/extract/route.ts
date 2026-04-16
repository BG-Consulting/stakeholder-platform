import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Stakeholder } from "../discover/route";

export const maxDuration = 90;

const client = new Anthropic();

const EXTRACT_SYSTEM_PROMPT = `You are a senior stakeholder intelligence analyst. Your task is to extract stakeholder information from uploaded documents.

Analyze the document and identify all individuals, organizations, government bodies, NGOs, media outlets, academic institutions, and international organizations mentioned that could be relevant stakeholders.

Rules:
- Extract REAL information from the document — do not fabricate or guess.
- The "name" field: for government positions use the role title and organisation; for others use the organisation name or individual's name as mentioned in the document.
- The "current_officeholder" field: use the name mentioned in the document if available, otherwise "To be verified".
- Each stakeholder MUST have a "category" field set to exactly one of: "Government & Regulatory", "Private Sector", "Civil Society & NGOs", "Media & Communications", "Academic & Research", "International Organizations & Donors".
- Base the "stance" on any indication in the document of their position. If unclear, use "neutral".
- Base the "influence_score" on context clues about their importance. If unclear, use 5.
- The "key_positions" should reflect what the document says about their positions, interests, or relevance.
- The "engagement_recommendation" should be based on the document context.
- The "contact" field: extract any contact info from the document. If none, use "".
- The "coordinates" field: provide approximate [longitude, latitude] if location is mentioned, otherwise [0, 0].
- Extract as many relevant stakeholders as the document contains — do not limit artificially.`;

const EXTRACT_FIELD_SCHEMA = `Each object must have exactly these fields:
- "name": string
- "organization": string
- "current_officeholder": string
- "type": string — exactly one of: "government", "private", "ngo", "media", "academic", "international"
- "category": string — exactly one of: "Government & Regulatory", "Private Sector", "Civil Society & NGOs", "Media & Communications", "Academic & Research", "International Organizations & Donors"
- "influence_score": number — integer 1–10
- "stance": string — exactly one of: "supportive", "neutral", "opposed"
- "key_positions": array of exactly 3 strings
- "engagement_recommendation": string
- "contact": string
- "coordinates": array of exactly 2 numbers — [longitude, latitude]
- "sources": array — always ["Uploaded document"]`;

function extractJsonArray(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const allowedExtensions = [".pdf", ".docx", ".pptx", ".txt"];
  const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF, DOCX, PPTX, or TXT file." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60_000);

  try {
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    let mediaType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "text/plain";
    if (fileName.endsWith(".pdf")) {
      mediaType = "application/pdf";
    } else if (fileName.endsWith(".docx")) {
      mediaType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileName.endsWith(".pptx")) {
      mediaType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else {
      mediaType = "text/plain";
    }

    console.log(`[extract] Processing file: ${file.name} (${mediaType}, ${bytes.byteLength} bytes)`);

    const userPrompt = `Analyze this uploaded document and extract ALL stakeholders mentioned in it.

For each stakeholder found, provide their information based on what the document contains.
If the document mentions their stance, position, or relevance, include that.
If not explicitly stated, make reasonable inferences based on context.

Return ONLY a valid JSON array — no markdown, no code fences, no prose before or after it.
${EXTRACT_FIELD_SCHEMA}

If the document contains no identifiable stakeholders, return an empty array: []`;

    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: EXTRACT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType as "application/pdf",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Claude returned no text" },
        { status: 500 }
      );
    }

    const jsonString = extractJsonArray(rawText);
    const stakeholders: Stakeholder[] = JSON.parse(jsonString);

    if (!Array.isArray(stakeholders)) {
      throw new Error("Response was not a JSON array");
    }

    // Normalise
    for (const s of stakeholders) {
      s.sources = ["Uploaded document"];
      if (!s.current_officeholder?.trim()) s.current_officeholder = "To be verified";
      if (!s.contact?.trim()) s.contact = "";
      if (!s.category) s.category = "Government & Regulatory";
      if (!Array.isArray(s.coordinates) || s.coordinates.length !== 2) s.coordinates = [0, 0];
    }

    const elapsed = Date.now() - startTime;
    console.log(`[extract] Done in ${elapsed}ms — ${stakeholders.length} stakeholders extracted`);

    return NextResponse.json({ stakeholders, source: file.name });
  } catch (err) {
    clearTimeout(timeoutId);

    if (controller.signal.aborted) {
      return NextResponse.json(
        { error: "Request timed out processing document. Please try a smaller file." },
        { status: 504 }
      );
    }

    const reason = err instanceof Error ? err.message : "Internal server error";
    console.error(`[extract] Error:`, err);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}

