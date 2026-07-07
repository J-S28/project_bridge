import { GoogleGenerativeAI, type Schema } from "@google/generative-ai";

const PRIMARY_KEY = process.env.GEMINI_API_KEY!;
const BACKUP_KEY = process.env.GEMINI_API_KEY_BACKUP;

type GeminiContent =
  | string
  | Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;

interface GeminiGenerationConfig {
  responseMimeType?: string;
  responseSchema?: Schema;
}

// Each Google AI Studio project has its own separate free-tier quota. Trying
// a backup key (a second, independent project) after the primary one fails
// roughly doubles how much headroom we have before a real request gets
// refused — at zero cost, since both keys stay on the free tier.
export async function generateWithFallback(
  modelName: string,
  generationConfig: GeminiGenerationConfig | undefined,
  content: GeminiContent
) {
  const keys = [PRIMARY_KEY, BACKUP_KEY].filter((k): k is string => !!k);

  let lastError: unknown;
  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      return await model.generateContent(content);
    } catch (err) {
      lastError = err;
      console.error(`Gemini call failed with key ending …${key.slice(-4)}`, err);
    }
  }
  throw lastError;
}
