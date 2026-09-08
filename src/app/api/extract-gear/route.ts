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

    // Production-ready stable Flash models
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let resultText = '';
    let lastErrorMsg = '';

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
          lastErrorMsg = data?.error?.message || `Model ${modelName} returned status ${response.status}`;
          console.warn(`Model ${modelName} failed:`, lastErrorMsg);
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || 'Network fetch failed';
        console.warn(`Model ${modelName} fetch exception:`, lastErrorMsg);
      }
    }

    if (!resultText) {
      // Clean user messaging for rate limits
      let userMsg = lastErrorMsg;
      if (lastErrorMsg.includes('quota') || lastErrorMsg.includes('429')) {
        userMsg = 'Gemini free tier rate limit reached. Please wait ~30 seconds and tap "Rescan Photo #1".';
      } else if (lastErrorMsg.includes('503') || lastErrorMsg.includes('demand')) {
        userMsg = 'Gemini AI servers are temporarily busy. Tap "Rescan Photo #1" in a few seconds.';
      }

      return NextResponse.json({ success: false, error: userMsg }, { status: 500 });
    }

    // Clean JSON output
    const cleanJsonString = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedData = JSON.parse(cleanJsonString);

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('AI Extraction Global Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Server error processing AI scan' 
    }, { status: 500 });
  }
}