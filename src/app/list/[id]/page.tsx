import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ShoppingBag, Package } from 'lucide-react';
import Wordmark from '../../../components/Wordmark';
import LegalFooter from '../../../components/LegalFooter';
import { AmazonLink, AmazonDisclosure } from '../../../components/AmazonLink';
import { normalizeSupabaseUrl } from '../../../lib/supabase';

export const metadata: Metadata = {
  title: 'Shared restock list | Tacklebox IQ',
  description: 'A fishing gear restock list shared from Tacklebox IQ.',
  robots: { index: false, follow: false },
};

interface SharedItem { brand?: string; name: string; detail?: string }
interface SharedList { title: string; items: SharedItem[]; created_at: string; expires_at: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadList(id: string): Promise<SharedList | null> {
  if (!UUID.test(id)) return null;
  const supabase = createClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.rpc('get_shared_list', { list_id: id });
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0];
  const items = (Array.isArray(row.items) ? row.items : [])
    .filter((i: unknown): i is SharedItem => !!i && typeof (i as SharedItem).name === 'string' && !!(i as SharedItem).name.trim());
  return { title: row.title, items, created_at: row.created_at, expires_at: row.expires_at };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function SharedListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await loadList(id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="text-base leading-none hover:opacity-80 transition"><Wordmark /></Link>
          <Link href="/" className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition whitespace-nowrap">Get the app</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {!list ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold">This list isn&apos;t available</h1>
            <p className="text-sm text-slate-400 mt-2">The link may have expired (shared lists last 30 days) or been mistyped.</p>
            <Link href="/" className="inline-block mt-6 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition">
              ABOUT TACKLEBOX IQ
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-500" /> {list.title}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1">
              {list.items.length} {list.items.length === 1 ? 'item' : 'items'} · shared {formatDate(list.created_at)} · link expires {formatDate(list.expires_at)}
            </p>

            <ul className="mt-6 space-y-2.5">
              {list.items.map((item, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-slate-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.brand && <span className="block text-[10px] font-mono text-amber-400 uppercase">{item.brand}</span>}
                    <span className="block text-sm font-semibold text-slate-100">{item.name}</span>
                    {item.detail && <span className="block text-xs font-mono text-slate-500">{item.detail}</span>}
                  </div>
                  <AmazonLink brand={item.brand} name={item.name} />
                </li>
              ))}
            </ul>

            <AmazonDisclosure className="mt-4 text-center" />

            <section className="mt-10 rounded-2xl bg-slate-900 border border-slate-800 p-5 text-center">
              <p className="text-sm font-bold">Keep your own tackle box sorted</p>
              <p className="text-xs text-slate-400 mt-1">Tacklebox IQ tracks your gear, plans trips and builds restock lists. Free to use.</p>
              <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition">
                GET STARTED
              </Link>
            </section>
          </>
        )}
      </main>

      <LegalFooter />
    </div>
  );
}
