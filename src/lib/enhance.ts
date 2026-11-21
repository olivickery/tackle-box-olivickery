/**
 * On-device photo "auto enhance" (no AI, no server): stretches the brightness
 * range, lifts dark shots a little and adds a touch of colour. It only
 * rescales the pixels already there, so lure colours aren't invented.
 */

const MAX_DIMENSION = 2048;

/** Loads an image URL (or blob URL) into an ImageBitmap without tainting a canvas. */
async function loadBitmap(src: string): Promise<ImageBitmap> {
  const res = await fetch(src, { mode: 'cors' });
  if (!res.ok) throw new Error(`Couldn't load the photo (${res.status})`);
  return createImageBitmap(await res.blob());
}

/**
 * `onlyIfNeeded` (used when photos are added): returns null for photos that
 * already use the full brightness range and aren't dark, so good shots are
 * left exactly as taken.
 */
export async function enhanceImage(src: string, opts: { onlyIfNeeded: true }): Promise<Blob | null>;
export async function enhanceImage(src: string, opts?: { onlyIfNeeded?: false }): Promise<Blob>;
export async function enhanceImage(src: string, opts: { onlyIfNeeded?: boolean } = {}): Promise<Blob | null> {
  const bitmap = await loadBitmap(src);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // Luminance histogram (sampled for speed on big photos).
  const hist = new Uint32Array(256);
  const step = Math.max(1, Math.floor((w * h) / 400_000)) * 4;
  let samples = 0;
  let lumSum = 0;
  for (let i = 0; i < d.length; i += step) {
    const y = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    hist[y]++;
    lumSum += y;
    samples++;
  }

  // Ignore the darkest / brightest 0.5% so specks and glare don't hold the range back.
  const cut = samples * 0.005;
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > cut) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > cut) { hi = v; break; } }
  // Don't over-stretch photos that are already low-contrast on purpose (e.g. a white background).
  if (hi - lo < 40) { lo = Math.max(0, lo - 20); hi = Math.min(255, hi + 20); }
  const range = Math.max(1, hi - lo);

  // Gentle midtone lift for dark shots: aim the average towards ~0.5, never darken.
  const mean = (lumSum / samples - lo) / range;

  if (opts.onlyIfNeeded) {
    const flat = lo > 14 || hi < 240;           // washed out / grey, or no true whites
    const dark = lumSum / samples / 255 < 0.38;  // underexposed overall
    if (!flat && !dark) return null;
  }
  const gamma = mean > 0.05 && mean < 0.45 ? Math.min(1, Math.max(0.7, Math.log(0.5) / Math.log(mean))) : 1;

  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v - lo) / range));
    lut[v] = Math.round(Math.pow(t, gamma) * 255);
  }

  const SAT = 1.1;
  for (let i = 0; i < d.length; i += 4) {
    const r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];
    const y = r * 0.299 + g * 0.587 + b * 0.114;
    d[i] = y + (r - y) * SAT;
    d[i + 1] = y + (g - y) * SAT;
    d[i + 2] = y + (b - y) * SAT;
  }
  ctx.putImageData(img, 0, 0);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))), 'image/jpeg', 0.9),
  );
}

/*
 * Enhanced copies are stored as "<uid>/enh-<time>--<base64url(original URL)>.jpg",
 * so Revert can restore the original without any database change.
 */
const ENHANCED_RE = /\/enh-\d+--([A-Za-z0-9_-]+)\.jpg(?:\?.*)?$/;

function toBase64Url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(s: string) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b + '='.repeat((4 - (b.length % 4)) % 4))));
}

export function enhancedPath(userId: string, originalUrl: string) {
  return `${userId}/enh-${Date.now()}--${toBase64Url(originalUrl)}.jpg`;
}

/** The original photo URL behind an enhanced copy, or null if `url` isn't one. */
export function originalOfEnhanced(url: string): string | null {
  const m = url.match(ENHANCED_RE);
  if (!m) return null;
  try { return fromBase64Url(m[1]); } catch { return null; }
}

/** Storage path (inside the bucket) of a public URL in our bucket, e.g. "<uid>/enh-….jpg". */
export function storagePathOf(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = publicUrl.indexOf(marker);
  return i >= 0 ? decodeURIComponent(publicUrl.slice(i + marker.length).split('?')[0]) : null;
}
