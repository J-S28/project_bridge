import { NextRequest, NextResponse } from "next/server";
import { SchemaType, type Schema } from "@google/generative-ai";
import { generateWithFallback } from "@/lib/geminiFallback";

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

  const prompt = `Transcribe this citizen's spoken civic complaint exactly, in the \
original language they spoke it in - do not translate it. Also report the "language" \
you detected (e.g. "English", "Hindi", "Telugu", "Tamil", or whatever it actually is).`;

  try {
    const result = await generateWithFallback(
      "gemini-2.5-flash",
      { responseMimeType: "application/json", responseSchema },
      [
        { text: prompt },
        { inlineData: { data: audioBase64, mimeType: mimeType || "audio/webm" } },
      ]
    );
    const parsed = JSON.parse(result.response.text());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini transcription failed", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
