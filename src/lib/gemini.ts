/**
 * Server-only helper: asks Gemini for a JSON answer, trying the newer model
 * first and falling back to the older one (same pattern as the trip planner).
 */
const MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash'];

export type GeminiJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string };

export async function generateJson(prompt: string, temperature = 0.4): Promise<GeminiJsonResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return { ok: false, status: 500, error: 'GEMINI_API_KEY environment variable is not set' };

  let text = '';
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: 'application/json', temperature },
          }),
        },
      );
      const data = await res.json();
      const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.ok && typeof candidate === 'string') {
        text = candidate;
        break;
      }
    } catch {
      // Try the next model.
    }
  }

  if (!text) {
    return { ok: false, status: 429, error: 'The AI guide is busy. Please wait a few seconds and try again.' };
  }
  try {
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return { ok: true, data: JSON.parse(clean) };
  } catch {
    return { ok: false, status: 502, error: "The AI guide's answer couldn't be read. Please try again." };
  }
}
