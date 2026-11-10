import { supabase } from './supabase';
import type { PackEntry, PackGap } from '../components/PackChecklist';

export interface GearItem {
  id: string;
  name: string;
  brand: string;
  type: string;
  depth: string;
  color: string;
  is_favorite: boolean;
  is_ghost: boolean;
  image_url: string;
  image_urls: string[];
  notes?: string;
  species: string[];
  environment_tags?: string[];
  created_at?: string;
}

export interface GapItem {
  item: string;
  type: string;
  reason: string;
}

export interface TripPlan {
  trip_summary: string;
  recommended_gear_ids: string[];
  loadout_highlights: { item_id: string; reason: string }[];
  missing_recommendations: GapItem[];
}

/** A saved pack list (row in public.pack_lists). */
export interface PackList {
  id: string;
  title: string;
  location: string | null;
  species: string[];
  conditions: string | null;
  trip_date: string | null;
  plan: TripPlan;
  checked: string[];
  added_gaps: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const SUGGESTED_NOTE_PREFIX = 'Suggested by Trip Planner';

// Must match the gear type options in the Add / Edit forms and the plan-trip prompt.
export const GEAR_TYPES = [
  'Hardbody', 'Soft Plastic', 'Topwater / Surface', 'Jerkbait', 'Metal Jig', 'Vibe / Blade',
  'Reel', 'Rod', 'Terminal tackle', 'Tool', 'Accessory',
];

/** Accepts older plans (gaps as plain strings) and tidies whatever the AI returned. */
export function normalizePlan(raw: unknown): TripPlan {
  const p = (raw ?? {}) as Record<string, unknown>;
  const gapsRaw = Array.isArray(p.missing_recommendations) ? p.missing_recommendations : [];
  return {
    trip_summary: typeof p.trip_summary === 'string' ? p.trip_summary : '',
    recommended_gear_ids: Array.isArray(p.recommended_gear_ids) ? p.recommended_gear_ids.map(String) : [],
    loadout_highlights: Array.isArray(p.loadout_highlights)
      ? (p.loadout_highlights as { item_id?: unknown; reason?: unknown }[])
          .filter(h => h && h.item_id)
          .map(h => ({ item_id: String(h.item_id), reason: typeof h.reason === 'string' ? h.reason : '' }))
      : [],
    missing_recommendations: gapsRaw
      .map((g): GapItem | null => {
        if (typeof g === 'string') return g.trim() ? { item: g.trim(), type: 'Accessory', reason: '' } : null;
        if (g && typeof g === 'object') {
          const o = g as Record<string, unknown>;
          const item = typeof o.item === 'string' ? o.item.trim() : '';
          if (!item) return null;
          const type = typeof o.type === 'string' && GEAR_TYPES.includes(o.type) ? o.type : 'Accessory';
          return { item, type, reason: typeof o.reason === 'string' ? o.reason : '' };
        }
        return null;
      })
      .filter((g): g is GapItem => g !== null),
  };
}

/** Tidies a gear_items row from Supabase for display. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatGearRow(row: any): GearItem {
  return {
    ...row,
    type: row.type === 'Hardbody Suspending' ? 'Hardbody' : row.type,
    environment_tags: row.environment_tags || [],
    image_urls: (row.image_urls && row.image_urls.length > 0 ? row.image_urls : [row.image_url]).filter(Boolean),
  } as GearItem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatPackRow(row: any): PackList {
  return {
    ...row,
    species: row.species || [],
    checked: row.checked || [],
    added_gaps: row.added_gaps || [],
    plan: normalizePlan(row.plan),
  } as PackList;
}

export function splitSpecies(input: string): string[] {
  return input.split(',').map(s => s.trim()).filter(Boolean);
}

/** Default name for a new pack list, e.g. "Flathead, Bream · Estuary & River". */
export function defaultPackTitle(species: string[], location: string): string {
  return [species.join(', '), location].filter(Boolean).join(' · ') || 'Trip pack list';
}

/** Gear to pack: highlighted picks first, then other recommended items, skipping restock items. */
export function buildPackEntries(plan: TripPlan | null, items: GearItem[]): PackEntry[] {
  if (!plan) return [];
  const reasons = new Map(plan.loadout_highlights.map(h => [h.item_id, h.reason]));
  const ids = [...plan.loadout_highlights.map(h => h.item_id), ...plan.recommended_gear_ids];
  const seen = new Set<string>();
  const entries: PackEntry[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const gear = items.find(i => i.id === id && !i.is_ghost);
    if (!gear) continue;
    entries.push({
      id: gear.id,
      brand: gear.brand,
      name: gear.name,
      detail: [gear.type, gear.color, gear.depth && gear.depth !== 'N/A' ? gear.depth : ''].filter(Boolean).join(' · '),
      image: gear.image_urls?.[0] || gear.image_url || undefined,
      reason: reasons.get(id),
    });
  }
  return entries;
}

/** Each gap's current state, worked out from what's actually in the user's gear. */
export function buildPackGaps(plan: TripPlan | null, addedGaps: string[], items: GearItem[], loading: boolean): PackGap[] {
  return (plan?.missing_recommendations || []).map(g => {
    if (!addedGaps.includes(g.item)) return { ...g, status: 'pending' };
    if (loading) return { ...g, status: 'on-list' };
    const name = g.item.trim().toLowerCase();
    const match = items.find(i => i.name.trim().toLowerCase() === name);
    return { ...g, status: !match ? 'removed' : match.is_ghost ? 'on-list' : 'bought' };
  });
}

/**
 * Adds a plan's not-yet-added gaps to the restock list (as is_ghost items with
 * no photo). Skips names already on the list. Returns the new rows and the
 * gap names that now count as added.
 */
export async function addGapsToRestock(opts: {
  userId: string;
  plan: TripPlan;
  addedGaps: string[];
  items: GearItem[];
  location: string;
  species: string[];
}): Promise<{ inserted: GearItem[]; newlyAdded: string[]; error?: string }> {
  const pending = opts.plan.missing_recommendations.filter(g => !opts.addedGaps.includes(g.item));
  if (pending.length === 0) return { inserted: [], newlyAdded: [] };

  const existingGhostNames = new Set(opts.items.filter(i => i.is_ghost).map(i => i.name.trim().toLowerCase()));
  const toInsert = pending.filter(g => !existingGhostNames.has(g.item.toLowerCase()));

  let inserted: GearItem[] = [];
  if (toInsert.length > 0) {
    const rows = toInsert.map(g => ({
      user_id: opts.userId,
      name: g.item,
      brand: '',
      type: g.type,
      depth: '',
      color: '',
      is_favorite: false,
      is_ghost: true,
      image_url: '',
      image_urls: [] as string[],
      notes: `${SUGGESTED_NOTE_PREFIX}${opts.location ? ` (${opts.location})` : ''}${g.reason ? `: ${g.reason}` : ''}`,
      species: opts.species.length ? opts.species : ['General'],
      environment_tags: opts.location ? [opts.location] : [],
    }));
    const { data, error } = await supabase.from('gear_items').insert(rows).select();
    if (error) return { inserted: [], newlyAdded: [], error: error.message };
    inserted = (data || []).map(formatGearRow);
  }
  return { inserted, newlyAdded: pending.map(g => g.item) };
}
