'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { Gift, Handshake, Loader2, Check, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  parseSharedCard, headlineFor, claimErrorMessage, copyPhotosToMyFolder,
  PENDING_CLAIM_KEY, type SharedCard,
} from '../../../lib/sharedCards';

type Status = 'idle' | 'claiming' | 'done';

export default function ClaimCard({ id, initial }: { id: string; initial: SharedCard | null }) {
  const [shared, setShared] = useState<SharedCard | null>(initial);
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      // Signed in: re-read so "is this mine / already claimed" reflects this user.
      if (data.session && initial) {
        const { data: rows } = await supabase.rpc('get_shared_card', { card_id: id });
        if (Array.isArray(rows) && rows[0]) setShared(parseSharedCard(rows[0]));
      }
      setChecking(false);
    });
  }, [id, initial]);

  if (!shared) {
    return (
      <div className="text-center py-16">
        <Gift className="w-10 h-10 text-slate-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold">This link isn&apos;t available</h1>
        <p className="text-sm text-slate-400 mt-2">It may have been mistyped, or the sender cancelled it.</p>
        <Link href="/" className="inline-block mt-6 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition">
          ABOUT TACKLEBOX IQ
        </Link>
      </div>
    );
  }

  const { card } = shared;
  const spec = card.depth && card.depth !== 'N/A' ? card.depth : '';
  const unavailable = status !== 'done' && (shared.is_claimed || shared.is_expired || shared.is_mine);

  const claim = async () => {
    if (!session) return;
    setStatus('claiming');
    setError(null);
    const { data: newId, error: rpcError } = await supabase.rpc('claim_shared_card', { card_id: id });
    if (rpcError || !newId) {
      setError(claimErrorMessage(rpcError));
      setStatus('idle');
      return;
    }
    // Keep the card's photos working even if the sender later deletes theirs.
    await copyPhotosToMyFolder(String(newId), session.user.id, card.image_urls);
    setStatus('done');
  };

  const signUpFirst = (mode: 'signup' | 'signin') => {
    try { localStorage.setItem(PENDING_CLAIM_KEY, id); } catch { /* ignore */ }
    router.push(`/?auth=${mode}`);
  };

  return (
    <>
      <p className="text-sm text-slate-400 flex items-center gap-2">
        {shared.is_transfer ? <Handshake className="w-4 h-4 text-amber-400" /> : <Gift className="w-4 h-4 text-fuchsia-300" />}
        {headlineFor(shared)}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {card.brand && <span className="block text-xs font-mono text-amber-400 uppercase tracking-normal mb-1">{card.brand}</span>}
        {card.name}
      </h1>

      <div className="mt-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="aspect-square bg-slate-950 flex items-center justify-center">
          {card.image_urls.length > 0
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={card.image_urls[photo]} alt={card.name} className="w-full h-full object-cover" />
            : <Package className="w-16 h-16 text-slate-700" />}
        </div>
        {card.image_urls.length > 1 && (
          <div className="flex gap-2 px-3 pt-3 overflow-x-auto">
            {card.image_urls.map((src, i) => (
              <button key={src} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${i === photo ? 'border-amber-500' : 'border-transparent opacity-70'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <dl className="px-4 py-2 text-sm">
          {[
            ['Type', card.type],
            ['Colour', card.color],
            ['Specs', spec],
            ['Species', card.species.join(', ')],
            ['Where', card.environment_tags.join(', ')],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 border-b border-slate-800 last:border-0">
              <dt className="text-slate-400">{k}</dt><dd className="text-slate-100 text-right">{v}</dd>
            </div>
          ))}
        </dl>
        {card.notes && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{card.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
          </div>
        )}

        {status === 'done' ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-300 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Added to your tackle box</p>
            <Link href="/" className="inline-block mt-3 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition">
              OPEN MY TACKLE BOX
            </Link>
          </div>
        ) : unavailable ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
            <p className="text-sm text-slate-300">
              {shared.is_mine ? "This is your own card, so it's already in your tackle box."
                : shared.is_claimed ? 'This card has already been added to someone’s tackle box.'
                : 'This link has expired. Ask for a new one.'}
            </p>
            <Link href="/" className="inline-block mt-3 text-xs font-mono font-bold text-amber-400 hover:text-amber-300">OPEN TACKLEBOX IQ →</Link>
          </div>
        ) : checking ? (
          <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
        ) : session ? (
          <button onClick={claim} disabled={status === 'claiming'}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-mono text-xs font-bold py-3.5 flex items-center justify-center gap-2 transition">
            {status === 'claiming' && <Loader2 className="w-4 h-4 animate-spin" />}
            ADD TO MY TACKLE BOX
          </button>
        ) : (
          <div className="space-y-2">
            <button onClick={() => signUpFirst('signup')}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold py-3.5 transition">
              CREATE A FREE ACCOUNT TO ADD IT
            </button>
            <button onClick={() => signUpFirst('signin')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-2 transition">
              Already have an account? Sign in
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Tacklebox IQ keeps track of your fishing gear, plans trips and builds restock lists.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
