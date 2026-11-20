import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Wordmark from '../../../components/Wordmark';
import LegalFooter from '../../../components/LegalFooter';
import { normalizeSupabaseUrl } from '../../../lib/supabase';
import { parseSharedCard, headlineFor, UUID_RE, type SharedCard } from '../../../lib/sharedCards';
import ClaimCard from './ClaimCard';

// cache(): generateMetadata and the page share one lookup per request.
const loadCard = cache(async (id: string): Promise<SharedCard | null> => {
  if (!UUID_RE.test(id)) return null;
  const supabase = createClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.rpc('get_shared_card', { card_id: id });
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return parseSharedCard(data[0]);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const shared = await loadCard(id);
  if (!shared) {
    return { title: 'Gift card | Tacklebox IQ', robots: { index: false, follow: false } };
  }
  const label = `${shared.card.brand ? `${shared.card.brand} ` : ''}${shared.card.name}`;
  const title = `${headlineFor(shared)} ${label}`;
  const description = 'Add it to your own Tacklebox IQ tackle box. Free to use.';
  return {
    title: `${title} | Tacklebox IQ`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: 'Tacklebox IQ',
      type: 'website',
      ...(shared.card.image_url ? { images: [{ url: shared.card.image_url }] } : {}),
    },
  };
}

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shared = await loadCard(id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="text-base leading-none hover:opacity-80 transition"><Wordmark /></Link>
          <Link href="/" className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition whitespace-nowrap">Open the app</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <ClaimCard id={id} initial={shared} />
      </main>

      <LegalFooter />
    </div>
  );
}
