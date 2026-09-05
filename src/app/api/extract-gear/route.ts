import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Explicitly run this route on the Node.js serverless runtime
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Server error: GEMINI_API_KEY is undefined in process.env');
      return NextResponse.json({ error: 'GEMINI_API_KEY missing from server configuration' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Download image from Supabase Storage public URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image from URL:', imageUrl);
      return NextResponse.json({ error: 'Failed to download image from storage' }, { status: 400 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // JSON Schema
    const gearSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING, description: 'Brand name on package' },
        name: { type: Type.STRING, description: 'Lure model name' },
        color: { type: Type.STRING, description: 'Visible colorway' },
        depth: { type: Type.STRING, description: 'Weight or depth spec' },
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        'Analyze this fishing gear photo. Read the brand, model, weight/depth specs, colorway, and category from the package.'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: gearSchema
      }
    });

    const extractedData = JSON.parse(response.text || '{}');
    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('Gemini vision API error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Vision extraction failed' }, { status: 500 });
  }
}