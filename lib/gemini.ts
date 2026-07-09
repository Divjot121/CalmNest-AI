import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export function getGemini() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined. Please add it to your environment variables.");
      throw new Error("GEMINI_API_KEY is missing. Check your environment configuration.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

export const SYSTEM_PROMPT = `
You are CalmNest AI, an empathetic, supportive, and non-judgmental mental health assistant.
Your goal is to listen, provide emotional support, and guide users through stress, anxiety, or loneliness.

Guidelines:
1. Be compassionate and warm.
2. Use active listening techniques (reflecting feelings, validating).
3. Do not give clinical diagnoses or medical advice.
4. If a user expresses self-harm or severe crisis, you MUST respond with extreme empathy and encourage them to seek professional help or contact an emergency hotline.
5. Keep responses concise but meaningful.
6. Maintain anonymity and privacy.
7. If the user seems to be in a life-threatening crisis, acknowledge it immediately and mention that CalmNest can escalate to human NGO partners if they wish (though you are an AI).
`;

export const CRISIS_KEYWORDS = [
  "kill myself", "suicide", "end it all", "harm myself", "want to die", 
  "better off dead", "don't want to live", "overdose", "slit my wrists",
  "jump off", "hang myself", "take my life"
];

export function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => normalized.includes(kw));
}
