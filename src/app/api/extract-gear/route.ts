import { NextResponse } from 'next/server';

// Helper function to retry API calls automatically on 503/429 spikes
async function fetchWithRetry(url: string, options: any, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // If Gemini is temporarily busy (503 or 429), wait and retry
      if ((response.status === 503 || response.status === 429) && i < retries - 1) {
        console.log(`Gemini busy (Status ${response.status}). Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff: 1s, 2s, 4s
        continue;
      }

      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff *= 2;
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API key is not configured' }, { status: 500 });
    }

    // Fetch image as arrayBuffer to convert to Base64 for Gemini Vision
    const imageRes = await fetch(imageUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    const prompt = `Analyze this fishing gear image and return a raw valid JSON object with these keys:
    - "brand": Brand name (e.g. Megabass, Daiwa, Shimano, Rapala)
    - "name": Item name
    - "color": Colourway name
    - "depth": Diving depth or specs if written on packaging (e.g. "1.5m", "9g", "70mm")
    - "type": Choose EXACTLY ONE from: "Hardbody", "Soft Plastic", "Topwater / Surface", "Jerkbait", "Metal Jig", "Vibe / Blade", "Reel", "Rod", "Terminal tackle", "Tool", "Accessory"
    - "species": Array of strings representing target fish species (e.g. ["Bass", "Bream"])

    Return ONLY the raw JSON object without markdown formatting or code blocks.`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
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
    };

    // Execute request with automatic 503 retry backoff
    const response = await fetchWithRetry(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'AI server is temporarily busy. Tap rescan to try again.' },
        { status: response.status }
      );
    }

    // Parse returned JSON from Gemini
    const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('API Error in extract-gear:', error);
    return NextResponse.json(
      { success: false, error: 'AI scan temporary timeout. Tap rescan to try again.' },
      { status: 500 }
    );
  }
}