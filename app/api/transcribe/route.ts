import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    transcript: { type: SchemaType.STRING },
    language: { type: SchemaType.STRING },
  },
  required: ["transcript", "language"],
};

export async function POST(req: NextRequest) {
  const { audioBase64, mimeType } = await req.json();

  if (!audioBase64 || typeof audioBase64 !== "string") {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt = `Transcribe this citizen's spoken civic complaint exactly, in the \
original language they spoke it in - do not translate it. Also report the "language" \
you detected (e.g. "English", "Hindi", "Telugu", "Tamil", or whatever it actually is).`;

  try {
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: audioBase64, mimeType: mimeType || "audio/webm" } },
    ]);
    const parsed = JSON.parse(result.response.text());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini transcription failed", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
