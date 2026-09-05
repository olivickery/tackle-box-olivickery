import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Call AI Vision endpoint to analyze image specs
    // Replace with your preferred Vision API key (e.g. GEMINI_API_KEY)
    const prompt = `Analyze this fishing gear/lure photo. Extract specs into this exact JSON format:
    {
      "brand": "Brand Name or Unknown",
      "name": "Model/Lure Name or Unknown",
      "color": "Primary Colors or Colorway",
      "depth": "Estimated Running Depth (e.g. 1.2m, Surface, Deep)",
      "type": "Select ONE: Hardbody Suspending, Soft Plastic, Topwater / Surface, Jerkbait, Metal Jig, Vibe / Blade, Reel, Rod, Terminal tackle, Tool, Accessory",
      "species": ["Species1", "Species2"]
    }`;

    // Mock/Fallback extraction payload structured for client form auto-fill
    const extractedData = {
      brand: 'Megabass',
      name: 'Vision 110',
      color: 'Chartreuse / Silver',
      depth: '1.2m',
      type: 'Hardbody Suspending',
      species: ['Bass', 'Barramundi', 'Trout']
    };

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Error extracting gear metadata:', error);
    return NextResponse.json({ error: 'Failed to extract gear details' }, { status: 500 });
  }
}