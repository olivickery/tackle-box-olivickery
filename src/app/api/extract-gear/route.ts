import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY missing from environment variables' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Download photo from Supabase Storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to download image from storage' }, { status: 400 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // JSON Output Schema
    const gearSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING, description: 'Brand name found on package (e.g. Chasebaits)' },
        name: { type: Type.STRING, description: 'Lure or product name (e.g. The Swinger)' },
        color: { type: Type.STRING, description: 'Visible colorway (e.g. Natural Green)' },
        depth: { type: Type.STRING, description: 'Weight or length spec (e.g. 9g, 90mm)' },
        type: { 
          type: Type.STRING, 
          description: 'Must match one: Hardbody Suspending, Soft Plastic, Topwater / Surface, Jerkbait, Metal Jig, Vibe / Blade, Reel, Rod, Terminal tackle, Tool, Accessory' 
        },
        species: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Target fish species' 
        }
      },
      required: ['brand', 'name', 'color', 'depth', 'type', 'species']
    };

    // Use current supported flash vision model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        'Analyze this fishing lure packaging photo in detail. Extract the brand name, product model name, size/weight/depth specs, colorway, and gear type from the text on the package.'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: gearSchema
      }
    });

    const textResponse = response.text || '{}';
    const extractedData = JSON.parse(textResponse);

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('Gemini Vision Error:', error);
    return NextResponse.json({ error: error?.message || 'Vision extraction failed' }, { status: 500 });
  }
}