import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type Schema } from "@google/generative-ai";
import { DEPARTMENTS } from "@/lib/departments";
import { generateWithFallback } from "@/lib/geminiFallback";
import type { AIClassification } from "@/lib/types";

interface NearbyComplaint {
  id: string;
  summary: string;
  category: string;
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    department: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...DEPARTMENTS],
    },
    category: { type: SchemaType.STRING },
    subcategory: { type: SchemaType.STRING },
    priority: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["Critical", "High", "Medium", "Low"],
    },
    sentiment: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["Urgent", "Frustrated", "Neutral", "Appreciative", "Suggestion"],
    },
    summary: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
    escalateToRepresentative: { type: SchemaType.BOOLEAN },
    escalationReason: { type: SchemaType.STRING },
    duplicateOfId: {
      type: SchemaType.STRING,
      description:
        "The id of an existing nearby complaint this is clearly reporting the same underlying issue as, or omit/empty if it isn't a duplicate of any of them.",
    },
  },
  required: [
    "department",
    "category",
    "subcategory",
    "priority",
    "sentiment",
    "summary",
    "confidence",
    "escalateToRepresentative",
  ],
};

export async function POST(req: NextRequest) {
  const { text, nearbyComplaints } = (await req.json()) as {
    text: string;
    nearbyComplaints?: NearbyComplaint[];
  };

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Missing complaint text" }, { status: 400 });
  }

  const nearbyBlock =
    nearbyComplaints && nearbyComplaints.length > 0
      ? `\n\nHere are other open complaints already filed in this same ward in the last 30 days:\n${nearbyComplaints
          .map((c) => `- id "${c.id}" (${c.category}): ${c.summary}`)
          .join("\n")}\n\nIf the citizen's report below is clearly describing the SAME underlying \
issue as one of these (not just the same category — the same specific problem, e.g. the same \
pothole, the same water outage), set "duplicateOfId" to that complaint's id. Only do this when \
you're genuinely confident it's the same issue, not merely a similar type of complaint. Otherwise \
leave "duplicateOfId" out entirely.`
      : "";

  const prompt = `You are the triage system for a civic complaints platform in India. \
A citizen submitted the following report, possibly in English, Hindi, Telugu, or Tamil. \
Classify it.

Fixed departments (pick exactly one): ${DEPARTMENTS.join(", ")}.

Decide "priority" by urgency/impact, "sentiment" by the citizen's tone, and write a "summary" \
of 25 words or fewer in English regardless of the input language.

Critically, decide "escalateToRepresentative": true only if fixing this requires budget \
allocation or a capital infrastructure project (e.g. building a new road, a new drainage \
system, a new school) rather than a routine departmental fix (e.g. a pothole repair, a \
streetlight repair, garbage collection). If true, give a one-sentence "escalationReason".
${nearbyBlock}

Citizen's report:
"""
${text}
"""`;

  try {
    const result = await generateWithFallback(
      "gemini-2.5-flash",
      { responseMimeType: "application/json", responseSchema },
      prompt
    );
    const classification = JSON.parse(result.response.text()) as AIClassification & {
      duplicateOfId?: string;
    };
    return NextResponse.json(classification);
  } catch (err) {
    console.error("Gemini classification failed", err);
    return NextResponse.json({ error: "Classification failed" }, { status: 502 });
  }
}
