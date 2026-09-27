import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(req: Request) {
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
4. "missing_recommendations": Array of 1-3 strings noting essential gear gaps not present in their inventory.`;

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