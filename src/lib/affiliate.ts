/** Amazon Australia Associates tracking ID (amazon.com.au programme). */
export const AMAZON_AU_TAG = 'tackleboxiq-22';

/** Required Amazon Associates disclosure wording. */
export const AMAZON_DISCLOSURE = 'As an Amazon Associate, Tacklebox IQ earns from qualifying purchases.';

/**
 * Amazon.com.au search link for an item, carrying our Associates tag.
 * Unbranded items (e.g. trip-plan gaps like "lip grips") get "fishing" added
 * so results stay on-topic. Only the item's name goes in the URL.
 */
export function amazonSearchUrl(item: { brand?: string; name: string }): string {
  const brand = (item.brand || '').trim();
  const name = item.name.trim();
  let query = [brand, name].filter(Boolean).join(' ');
  if (!brand && !/fish|lure|rod|reel/i.test(query)) query += ' fishing';
  const params = new URLSearchParams({ k: query, tag: AMAZON_AU_TAG });
  return `https://www.amazon.com.au/s?${params.toString()}`;
}
