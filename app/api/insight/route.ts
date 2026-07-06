import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface InsightRequest {
  scopeLabel: string;
  currentPeriodCounts: Record<string, number>;
  previousPeriodCounts: Record<string, number>;
  topSubcategories: { subcategory: string; count: number }[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as InsightRequest;
  const { scopeLabel, currentPeriodCounts, previousPeriodCounts, topSubcategories } = body;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are writing a short analytics narrative for an elected representative's \
dashboard, covering civic complaints in ${scopeLabel}.

Department complaint counts, last 30 days: ${JSON.stringify(currentPeriodCounts)}
Department complaint counts, the 30 days before that: ${JSON.stringify(previousPeriodCounts)}
Top recurring complaint subcategories (last 30 days): ${JSON.stringify(topSubcategories)}

Write 3-4 sentences, in plain English, naming the sharpest change (e.g. "Road infrastructure \
complaints increased by 32% compared to last month") and one concrete recommendation for the \
representative. Be specific with numbers/percentages where the data supports it. Do not use \
markdown formatting, headings, or bullet points — plain prose only. If there isn't enough data \
for a meaningful comparison, say so plainly instead of inventing a trend.`;

  try {
    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();
    return NextResponse.json({ insight });
  } catch (err) {
    console.error("Gemini insight generation failed", err);
    return NextResponse.json({ error: "Insight generation failed" }, { status: 502 });
  }
}
