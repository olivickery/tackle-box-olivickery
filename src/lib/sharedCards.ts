import { supabase } from './supabase';
import type { GearItem } from './gear';

/** The card snapshot stored in shared_cards.card_payload. */
export interface CardPayload {
  name: string;
  brand: string;
  type: string;
  depth: string;
  color: string;
  notes: string;
  species: string[];
  environment_tags: string[];
  image_url: string;
  image_urls: string[];
}

/** What /claim/<id> shows, from get_shared_card(). */
export interface SharedCard {
  sender_name: string;
  card: CardPayload;
  is_transfer: boolean;
  is_claimed: boolean;
  is_expired: boolean;
  is_mine: boolean;
}

export const IMAGE_BUCKET = 'tackle-vault-images';
export const PENDING_CLAIM_KEY = 'tbiq:pendingClaim';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cardPayloadOf(item: GearItem): CardPayload {
  const photos = (item.image_urls?.length ? item.image_urls : [item.image_url]).filter(Boolean);
  return {
    name: item.name,
    brand: item.brand || '',
    type: item.type || '',
    depth: item.depth && item.depth !== 'N/A' ? item.depth : '',
    color: item.color || '',
    notes: item.notes || '',
    species: item.species || [],
    environment_tags: item.environment_tags || [],
    image_url: photos[0] || '',
    image_urls: photos,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseSharedCard(row: any): SharedCard | null {
  if (!row || !row.card_payload || typeof row.card_payload.name !== 'string') return null;
  const p = row.card_payload;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : []);
  const photos = arr(p.image_urls).length ? arr(p.image_urls) : arr([p.image_url]);
  return {
    sender_name: (row.sender_name || '').trim(),
    is_transfer: !!row.is_transfer,
    is_claimed: !!row.is_claimed,
    is_expired: !!row.is_expired,
    is_mine: !!row.is_mine,
    card: {
      name: p.name,
      brand: p.brand || '',
      type: p.type || '',
      depth: p.depth || '',
      color: p.color || '',
      notes: p.notes || '',
      species: arr(p.species),
      environment_tags: arr(p.environment_tags),
      image_url: photos[0] || '',
      image_urls: photos,
    },
  };
}

/** "Ben handed you" / "Ben sent you" / "You've been sent". */
export function headlineFor(card: SharedCard): string {
  const who = card.sender_name || 'A friend';
  return card.is_transfer ? `${who} handed you` : `${who} sent you`;
}

/** Creates a link for one card. Returns the claim URL. */
export async function createCardLink(item: GearItem, senderName: string, isTransfer: boolean): Promise<string> {
  const { data, error } = await supabase
    .from('shared_cards')
    .insert({
      sender_name: senderName,
      gear_item_id: item.id,
      card_payload: cardPayloadOf(item),
      is_transfer: isTransfer,
    })
    .select('id')
    .single();
  if (error || !data) throw error || new Error('No link created');
  return `${window.location.origin}/claim/${data.id}`;
}

const CLAIM_ERRORS: Record<string, string> = {
  not_signed_in: 'Please sign in first.',
  not_found: "This link doesn't exist. Check you copied all of it.",
  expired: 'This link has expired. Ask for a new one.',
  already_claimed: 'Someone has already added this card to their tackle box.',
  own_card: "This is your own card, so it's already in your tackle box.",
};

export function claimErrorMessage(err: unknown): string {
  const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
  const key = Object.keys(CLAIM_ERRORS).find((k) => msg.includes(k));
  return key ? CLAIM_ERRORS[key] : 'Something went wrong adding this card. Please try again.';
}

/**
 * Copies the sender's photos into the recipient's own storage folder and
 * points the new card at the copies, so it keeps working if the sender later
 * removes theirs. Best effort: if a copy fails, that photo keeps the sender's URL.
 */
export async function copyPhotosToMyFolder(gearId: string, userId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const copied = await Promise.all(urls.map(async (url, i) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return url;
      const blob = await res.blob();
      const ext = (blob.type.split('/')[1] || url.split('?')[0].split('.').pop() || 'jpg').replace('jpeg', 'jpg');
      const path = `${userId}/gift-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, { contentType: blob.type || undefined });
      if (error) return url;
      return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    } catch {
      return url;
    }
  }));
  if (copied.every((u, i) => u === urls[i])) return;
  const { error } = await supabase
    .from('gear_items')
    .update({ image_url: copied[0], image_urls: copied })
    .eq('id', gearId);
  if (error) console.error('Failed to point gifted card at copied photos:', error);
}
