'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Gift, Handshake, Loader2, Copy, Check, Share2, AlertTriangle } from 'lucide-react';
import type { GearItem } from '../lib/gear';
import { createCardLink } from '../lib/sharedCards';

type Kind = 'copy' | 'transfer';

/**
 * "Share or hand over": makes a one-claim link (and QR code) for a single
 * gear card. A copy leaves the sender's card alone; a hand-over moves the
 * sender's card to their restock list once the link is claimed.
 */
export default function ShareCardSheet({
  item,
  senderName,
  onNeedName,
  onClose,
}: {
  item: GearItem;
  senderName: string;
  onNeedName: () => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Kind>('copy');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ url: string; kind: Kind } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link.url, { margin: 1, width: 480, color: { dark: '#020617', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  const label = `${item.brand ? `${item.brand} ` : ''}${item.name}`;

  const create = async () => {
    if (!senderName) { onNeedName(); return; }
    setCreating(true);
    setError(null);
    try {
      const url = await createCardLink(item, senderName, kind === 'transfer');
      setLink({ url, kind });
    } catch (err) {
      console.error('Failed to create card link:', err);
      setError("Couldn't create a link just now. Please try again.");
    }
    setCreating(false);
  };

  const message = link
    ? `${senderName} ${link.kind === 'transfer' ? 'handed you' : 'sent you'} ${label} on Tacklebox IQ`
    : '';

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(`${message}: ${link.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy. Press and hold the link to copy it.');
    }
  };

  const shareLink = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: message, text: message, url: link.url });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) copyLink();
    }
  };

  const option = (k: Kind, icon: React.ReactNode, title: string, body: string) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      aria-pressed={kind === k}
      className={`w-full text-left flex gap-3 p-3 rounded-xl border transition ${
        kind === k ? 'border-amber-500/70 bg-amber-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${kind === k ? 'text-amber-400' : 'text-slate-400'}`}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-slate-100">{title}</span>
        <span className="block text-xs text-slate-400 leading-relaxed mt-0.5">{body}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl pb-12 sm:pb-6"
      >
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Share or hand over</p>
            <h2 id="share-card-title" className="text-lg font-semibold text-slate-100 leading-tight truncate">{label}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 min-h-11 px-3 -mr-1 rounded-lg text-sm font-semibold text-amber-400 hover:bg-slate-800 transition">
            Done
          </button>
        </div>

        {!link ? (
          <div className="px-4 pt-4 space-y-3">
            {option('copy', <Gift className="w-5 h-5" />, 'Share a copy',
              'They get their own copy of this card, photos and notes included. Yours stays as it is.')}
            {option('transfer', <Handshake className="w-5 h-5" />, 'Hand it over',
              "For gear you're physically giving away. When they add it, your card moves to your restock list with a note saying who has it.")}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              The link works once and expires after 30 days. Anyone you send it to will see the photos, specs and notes.
            </p>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
              </div>
            )}

            <button
              onClick={create}
              disabled={creating}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-mono text-xs font-bold py-3 flex items-center justify-center gap-2 transition"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {kind === 'transfer' ? 'CREATE HAND-OVER LINK' : 'CREATE GIFT LINK'}
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-4">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-slate-200">
                {link.kind === 'transfer'
                  ? 'Ask them to scan this, or send them the link. Your card moves to your restock list once they add it.'
                  : 'Ask them to scan this, or send them the link.'}
              </p>
              <div className="mt-3 w-56 h-56 rounded-xl bg-white p-2 flex items-center justify-center">
                {qr
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={qr} alt={`QR code for ${link.url}`} className="w-full h-full" />
                  : <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />}
              </div>
            </div>

            <p className="text-[11px] font-mono text-slate-400 break-all text-center select-all">{link.url}</p>

            {error && <p className="text-xs text-red-300 text-center">{error}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={copyLink} className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold min-h-11 flex items-center justify-center gap-2 transition">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <button onClick={shareLink} className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold min-h-11 flex items-center justify-center gap-2 transition">
                  <Share2 className="w-4 h-4" /> Send…
                </button>
              ) : (
                <button onClick={onClose} className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold min-h-11 transition">
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
