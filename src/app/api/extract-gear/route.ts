import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY environment variable is not set' }, { status: 500 });
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

Return ONLY valid raw JSON with no Markdown formatting or text wrapping.`;

    const modelName = 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let resultText = '';
    let lastErrorData: any = null;

    // Retry up to 3 times with exponential backoff if Google returns a rate limit (429/503)
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        resultText = data.candidates[0].content.parts[0].text;
        break; // Success!
      } else {
        lastErrorData = data;
        // If rate limited or busy, wait 2 seconds before retrying
        if (attempt < 3 && (response.status === 429 || response.status === 503)) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!resultText) {
      const msg = lastErrorData?.error?.message || 'AI service unavailable';
      throw new Error(msg);
    }

    // Clean JSON output
    const cleanJsonString = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(cleanJsonString);

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    
    const rawMsg = error?.message || '';
    let userMessage = 'Failed to analyze image with AI';

    if (rawMsg.includes('quota') || rawMsg.includes('429') || rawMsg.includes('exceeded')) {
      userMessage = 'Gemini free rate limit reached. Please wait ~30 seconds and tap "Rescan Photo #1".';
    } else if (rawMsg.includes('503') || rawMsg.includes('demand')) {
      userMessage = 'Gemini AI servers are temporarily busy. Tap "Rescan Photo #1" in a few seconds.';
    }

    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}