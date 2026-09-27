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

    const inventorySummary = inventory.map((item: any) => ({
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
- Target Species: ${targetSpecies.join(', ')}
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

Respond ONLY with clean JSON.`;

    const modelName = 'gemini-3.6-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    const data = await response.json();

    if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const rawText = data.candidates[0].content.parts[0].text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedPlan = JSON.parse(rawText);
      return NextResponse.json({ success: true, plan: parsedPlan });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to generate loadout plan.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Trip Planner Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error planning trip' },
      { status: 500 }
    );
  }
}