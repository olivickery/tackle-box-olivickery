import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';

const apiKey = process.env.GEMINI_API_KEY || '';

// Must match the gear type options in the Add / Edit forms.
const GEAR_TYPES = [
  'Hardbody', 'Soft Plastic', 'Topwater / Surface', 'Jerkbait', 'Metal Jig', 'Vibe / Blade',
  'Reel', 'Rod', 'Terminal tackle', 'Tool', 'Accessory',
];

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const { location, targetSpecies, conditions, inventory } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Ultra-compact text representation to minimize token load
    const inventoryLines = (inventory || [])
      .filter((item: any) => !item.is_ghost)
      .map((item: any) => {
        const specs = item.depth && item.depth !== 'N/A' ? ` Specs: ${item.depth}` : '';
        const species = item.species?.length ? ` Species: ${item.species.join(',')}` : '';
        const tags = item.environment_tags?.length ? ` Tags: ${item.environment_tags.join(',')}` : '';
        return `ID[${item.id}]: ${item.brand} ${item.name} (${item.type}, ${item.color})${specs}${species}${tags}`;
      })
      .join('\n');

    const prompt = `You are an expert fishing guide and tackle strategist. Create a custom loadout plan using ONLY items from the user's inventory.

TRIP DETAILS:
- Environment: ${location}
- Target Species: ${targetSpecies.length > 0 ? targetSpecies.join(', ') : 'General'}
- Conditions: ${conditions}

USER ACTIVE INVENTORY:
${inventoryLines}

TASK:
Respond ONLY with a clean JSON object containing:
1. "trip_summary": A brief 1-2 sentence tactical advice summary for these specific conditions and location.
2. "recommended_gear_ids": Array of item IDs (from ID[...] above) that are top picks.
3. "loadout_highlights": Array of objects: [{"item_id": "...", "reason": "1-sentence tip on retrieve/technique"}]
4. "missing_recommendations": Array of exactly 4 objects, ordered most important first, for useful gear gaps NOT present in their inventory (vary the gear types where it makes sense):
   [{"item": "short shopping-list name, e.g. 6lb fluorocarbon leader or 90mm suspending minnow", "type": one of ${GEAR_TYPES.map(t => `"${t}"`).join(', ')}, "reason": "1-sentence why it matters for this trip"}]`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    let resultText = '';
    let lastErrorMsg = '';

    for (const modelName of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2
            }
          })
        });

        const data = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          resultText = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastErrorMsg = data?.error?.message || response.statusText;
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Network error';
      }
    }

    if (!resultText) {
      let userMsg = 'AI rate limit reached. Please wait ~10 seconds before generating another plan.';
      return NextResponse.json({ success: false, error: userMsg }, { status: 429 });
    }

    const cleanJsonString = resultText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsedPlan = JSON.parse(cleanJsonString);
    return NextResponse.json({ success: true, plan: parsedPlan });

  } catch (error: any) {
    console.error('Trip Planner Global Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error generating loadout plan. Please try again.' },
      { status: 500 }
    );
  }
}