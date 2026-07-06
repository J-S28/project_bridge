import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { DEPARTMENTS } from "@/lib/departments";
import type { AIClassification } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Missing complaint text" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

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

Citizen's report:
"""
${text}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const classification = JSON.parse(result.response.text()) as AIClassification;
    return NextResponse.json(classification);
  } catch (err) {
    console.error("Gemini classification failed", err);
    return NextResponse.json({ error: "Classification failed" }, { status: 502 });
  }
}
