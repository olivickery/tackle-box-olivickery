import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // Fetch image and convert to base64
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    const prompt = `Analyze this fishing lure/gear packaging photo and extract the following details as a clean JSON object:
- "brand": string (e.g., Chasebaits, Berkley, Daiwa)
- "name": string (e.g., The Swinger, Money Badger)
- "color": string (e.g., Natural Green, Firetail)
- "depth": string (e.g., 2m, 9g, 90mm, or N/A)
- "type": string (choose best fit: "Hardbody", "Soft Plastic", "Topwater / Surface", "Jerkbait", "Metal Jig", "Vibe / Blade", "Reel", "Rod", "Terminal tackle", "Tool", "Accessory")
- "species": array of strings (e.g., ["Bass", "Bream"])

Return ONLY valid raw JSON with no Markdown or text wrapping.`;

    // Try primary model first, fallback to secondary if 503 / unavailable
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    let resultText = '';
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ]);
        resultText = response.response.text();
        if (resultText) break; // Success!
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or unavailable:`, err?.message);
        lastError = err;
      }
    }

    if (!resultText) {
      throw lastError || new Error('All AI models unavailable');
    }

    // Clean JSON output
    const cleanJsonString = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(cleanJsonString);

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    
    // Provide clean user-friendly messaging
    const isServerBusy = error?.status === 503 || error?.message?.includes('demand') || error?.message?.includes('503');
    const errorMessage = isServerBusy 
      ? 'Gemini AI servers are temporarily busy. Tap "Rescan Photo #1" in a few seconds.'
      : (error?.message || 'Failed to analyze image with AI');

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}