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

    const inventorySummary = (inventory || []).map((item: any) => ({
      id: item.id,
      brand: item.brand,
      name: item.name,
      type: item.type,
      color: item.color,
      specs: item.depth || '',
      species: item.species || [],
      location_tags: item.environment_tags || [],
      is_ghost: item.is_ghost
    }));

    const prompt = `You are an expert fishing guide and tackle strategist. Analyze the user's available tackle inventory and create a tailored custom loadout plan.

TRIP DETAILS:
- Location / Environment: ${location}
- Target Species: ${targetSpecies.length > 0 ? targetSpecies.join(', ') : 'General / Any'}
- Conditions: ${conditions}

AVAILABLE INVENTORY (JSON):
${JSON.stringify(inventorySummary, null, 2)}

TASK:
Generate a clean JSON response with the following keys:
1. "trip_summary": A brief 1-2 sentence guide summary explaining the strategy for these specific conditions and location.
2. "recommended_gear_ids": Array of item IDs from the provided inventory that are the top picks for this trip.
3. "loadout_highlights": Array of objects, each containing:
   - "item_id": string (matching item ID)
   - "reason": string (short 1-sentence tip on how to use/retrieve this specific item in these conditions)
4. "missing_recommendations": Array of strings (1-3 essential items or terminal tackle items not present in their inventory that they should consider adding for this specific trip).

Respond ONLY with valid JSON. Do not include extra conversational text outside the JSON object.`;

    const modelName = 'gemini-3.6-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let resultText = '';
    let lastErrorData: any = null;

    // Retry loop with backoff for rate limits or transient errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json'
            }
          })
        });

        const data = await response.json();

        if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          resultText = data.candidates[0].content.parts[0].text;
          break; // Success!
        } else {
          lastErrorData = data;
          console.warn(`Trip Planner attempt ${attempt} failed:`, data);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
        }
      } catch (err: any) {
        lastErrorData = { error: { message: err?.message || 'Network error' } };
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    if (!resultText) {
      const rawMsg = lastErrorData?.error?.message || '';
      let userMsg = 'Failed to generate loadout plan. Please try again.';

      if (rawMsg.includes('quota') || rawMsg.includes('429') || rawMsg.includes('exceeded')) {
        userMsg = 'AI rate limit reached. Please wait ~10 seconds and tap "Generate Custom Loadout" again.';
      } else if (rawMsg.includes('503') || rawMsg.includes('demand')) {
        userMsg = 'AI servers are temporarily busy. Please tap "Generate Custom Loadout" again in a moment.';
      }

      return NextResponse.json({ success: false, error: userMsg }, { status: 500 });
    }

    // Clean markdown code block formatting
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
      { success: false, error: error?.message || 'Server error planning trip' },
      { status: 500 }
    );
  }
}