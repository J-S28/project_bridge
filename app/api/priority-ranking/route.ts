import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type Schema } from "@google/generative-ai";
import { generateWithFallback } from "@/lib/geminiFallback";
import type { WardDemographics } from "@/lib/demographics";

interface WardInput {
  ward: string;
  suggestionCounts: { category: string; count: number }[];
  demographics: WardDemographics;
}

interface PriorityRankingRequest {
  scopeLabel: string;
  wards: WardInput[];
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    priorities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          ward: { type: SchemaType.STRING },
          justification: { type: SchemaType.STRING },
        },
        required: ["title", "ward", "justification"],
      },
    },
  },
  required: ["priorities"],
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PriorityRankingRequest;
  const { scopeLabel, wards } = body;

  if (!wards || wards.length === 0) {
    return NextResponse.json({ priorities: [] });
  }

  const prompt = `You are ranking development priorities for an elected representative covering \
${scopeLabel}, using two inputs per ward: (1) citizen suggestion counts by category, and (2) \
seeded demographic/infrastructure-gap data standing in for Census/NFHS/data.gov.in.

Data per ward:
${JSON.stringify(wards, null, 2)}

Return the top 3-5 development priorities across all these wards, ranked by how strongly citizen \
demand (suggestion counts) aligns with real infrastructure gaps (high infraGapScore, high \
distanceToNearestFacilityKm, missing relevant facility in existingFacilities). Each priority needs:
- "title": a short concrete project name naming the ward, e.g. "Vocational centre in Uppal"
- "ward": which ward it's for
- "justification": one line citing specific numbers, e.g. "62 suggestions, infra-gap score 68, \
no existing vocational infrastructure"

If suggestion counts are empty or too sparse to justify a ranking, return fewer (or zero) \
priorities rather than inventing demand that isn't there.`;

  try {
    const result = await generateWithFallback(
      "gemini-2.5-flash",
      { responseMimeType: "application/json", responseSchema },
      prompt
    );
    const parsed = JSON.parse(result.response.text());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini priority ranking failed", err);
    return NextResponse.json({ error: "Priority ranking failed" }, { status: 502 });
  }
}
