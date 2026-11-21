import { NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';
import { generateJson } from '../../../lib/gemini';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 12) : []);

/**
 * "Tips for using this item": sends one gear item's details to Gemini and
 * returns four short, practical tactics for fishing with it.
 * Body: { item: { brand, name, type, color, depth, species, environment_tags, notes }, avoid?: string[] }
 * `avoid` lists the user's current tips so "More tips" doesn't repeat them.
 */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  let body: { item?: Record<string, unknown>; avoid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
  const item = body.item || {};
  const name = str(item.name);
  if (!name) return NextResponse.json({ success: false, error: 'Missing item name' }, { status: 400 });

  const specs = str(item.depth);
  const species = list(item.species).join(', ');
  const places = list(item.environment_tags).join(', ');
  const notes = str(item.notes, 1500);
  const avoid = list(body.avoid).map((t) => str(t, 160)).filter(Boolean);

  const prompt = `You are an expert Australian fishing guide. Give practical tactics for getting the most out of ONE piece of the angler's own gear.

ITEM:
- Brand: ${str(item.brand) || 'Unknown'}
- Name: ${name}
- Type: ${str(item.type) || 'Unknown'}
- Colour: ${str(item.color) || 'Unknown'}
${specs && specs !== 'N/A' ? `- Specs: ${specs}\n` : ''}${species ? `- Target species: ${species}\n` : ''}${places ? `- Where it's used: ${places}\n` : ''}${notes ? `- Owner's notes / product info: ${notes}\n` : ''}
${avoid.length ? `The angler already has these tips, so give DIFFERENT ones:\n${avoid.map((a) => `- ${a}`).join('\n')}\n` : ''}
TASK:
Respond ONLY with a JSON object: {"tips": [{"title": "2-4 word heading, e.g. Retrieve, Best conditions, Rigging, Leader", "tip": "one or two plain-English sentences, specific to this item"}]}
Give exactly 4 tips covering different angles (e.g. retrieve or technique, where and when, rigging or setup, care or a common mistake). Be specific to this item's type and size; don't invent facts about the product.`;

  const result = await generateJson(prompt, 0.5);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });

  const raw = (result.data as { tips?: unknown })?.tips;
  const tips = (Array.isArray(raw) ? raw : [])
    .map((t) => ({ title: str((t as Record<string, unknown>)?.title, 40), tip: str((t as Record<string, unknown>)?.tip, 400) }))
    .filter((t) => t.tip)
    .slice(0, 4);

  if (tips.length === 0) {
    return NextResponse.json({ success: false, error: "The AI guide didn't return any tips. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ success: true, tips });
}
