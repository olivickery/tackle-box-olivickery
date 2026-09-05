import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing from process.env');
      return NextResponse.json({ error: 'Server missing GEMINI_API_KEY' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fetch image from Supabase public URL and convert to Base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image from URL:', imageUrl);
      return NextResponse.json({ error: 'Failed to download image from storage' }, { status: 400 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Structured JSON Schema for Gemini
    const gearSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING, description: 'Brand name on package (e.g. Chasebaits, Megabass, Shimano)' },
        name: { type: Type.STRING, description: 'Product or lure model name (e.g. The Swinger, Vision 110)' },
        color: { type: Type.STRING, description: 'Visible colorway (e.g. Natural Green / Chartreuse)' },
        depth: { type: Type.STRING, description: 'Weight or depth spec (e.g. 9g, 90mm, 1.2m, Surface)' },
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
        'Analyze this fishing gear/lure photo in detail. Extract the brand name, product name, weight/depth specifications, colorway, and gear type from the packaging text.'
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
    console.error('Gemini vision extraction server error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Failed to extract gear specs' }, { status: 500 });
  }
}