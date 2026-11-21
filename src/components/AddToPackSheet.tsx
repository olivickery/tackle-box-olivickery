'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Check, Plus, Loader2, Star, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  type GearItem, type PackList,
  formatPackRow, buildPackEntries, applyInventoryAdds, normalizePlan,
} from '../lib/gear';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60';

function formatTripDate(d: string | null) {
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

/**
 * "Add to pack list" from a gear item's details sheet: tick the item onto (or
 * off) any saved pack list, or start a new list with it.
 */
export default function AddToPackSheet({
  item,
  items,
  userId,
  onClose,
}: {
  item: GearItem;
  items: GearItem[];
  userId: string;
  onClose: () => void;
}) {
  const [packs, setPacks] = useState<PackList[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.from('pack_lists').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLoadError(error.message); setPacks([]); return; }
      const rows = (data || []).map(formatPackRow);
      // Favourites first, then most recent.
      rows.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));
      setPacks(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const isOnList = (p: PackList) =>
    buildPackEntries(p.plan, items, { hidden: p.hidden_items, custom: p.custom_items }).some((e) => e.id === item.id);

  const toggle = async (p: PackList) => {
    if (busyId) return;
    setBusyId(p.id);
    let changes: Pick<PackList, 'hidden_items' | 'custom_items'>;
    if (isOnList(p)) {
      // Take it off: drop it from the user's own items, or hide the plan's pick.
      const inCustom = p.custom_items.some((c) => c.id === item.id);
      changes = inCustom
        ? { hidden_items: p.hidden_items, custom_items: p.custom_items.filter((c) => c.id !== item.id) }
        : { hidden_items: [...p.hidden_items, item.id], custom_items: p.custom_items };
    } else {
      const next = applyInventoryAdds(p.plan, items, p.hidden_items, p.custom_items, [item.id]);
      changes = { hidden_items: next.hidden, custom_items: next.custom };
    }
    const { error } = await supabase.from('pack_lists').update(changes).eq('id', p.id);
    if (error) {
      alert(`Couldn't update that pack list: ${error.message}`);
    } else {
      setPacks((prev) => prev?.map((x) => (x.id === p.id ? { ...x, ...changes } : x)) ?? prev);
    }
    setBusyId(null);
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const title = newTitle.trim() || `${item.name} trip`;
    const { data, error } = await supabase.from('pack_lists').insert({
      user_id: userId,
      title,
      species: item.species || [],
      plan: normalizePlan({}),
      custom_items: [{ id: item.id, name: item.name, gearId: item.id }],
    }).select().single();
    setCreating(false);
    if (error || !data) {
      alert(`Couldn't create the pack list: ${error?.message ?? 'unknown error'}`);
      return;
    }
    setPacks((prev) => [formatPackRow(data), ...(prev || [])]);
    setNewTitle('');
  };

  const label = `${item.brand ? `${item.brand} ` : ''}${item.name}`;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-pack-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl pb-12 sm:pb-6"
      >
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Add to pack list</p>
            <h2 id="add-to-pack-title" className="text-lg font-semibold text-slate-100 leading-tight truncate">{label}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 min-h-11 px-3 -mr-1 rounded-lg text-sm font-semibold text-amber-400 hover:bg-slate-800 transition">
            Done
          </button>
        </div>

        <div className="px-4 pt-4 space-y-2">
          {packs === null ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
          ) : (
            <>
              {loadError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>Couldn&apos;t load your pack lists: {loadError}</span>
                </div>
              )}
              {packs.length === 0 && !loadError && (
                <p className="text-sm text-slate-400 py-2">You don&apos;t have any pack lists yet. Start one below.</p>
              )}
              {packs.map((p) => {
                const on = isOnList(p);
                const busy = busyId === p.id;
                const date = formatTripDate(p.trip_date);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p)}
                    disabled={!!busyId}
                    aria-pressed={on}
                    className={`w-full flex items-center gap-3 px-3 min-h-14 rounded-xl border text-left transition disabled:opacity-70 ${
                      on ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <ClipboardList className={`w-4 h-4 shrink-0 ${on ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                        {p.is_favorite && <Star className="w-3.5 h-3.5 fill-current text-amber-400 shrink-0" />}
                        <span className="truncate">{p.title}</span>
                      </span>
                      {(date || p.location) && (
                        <span className="block text-xs text-slate-400 truncate">{[date, p.location].filter(Boolean).join(' · ')}</span>
                      )}
                    </span>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 min-h-8 rounded-lg ${
                      on ? 'text-emerald-300' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                    }`}>
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : on ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {on ? 'Added' : 'Add'}
                    </span>
                  </button>
                );
              })}

              <form onSubmit={createList} className="pt-3">
                <p className="text-xs text-slate-400 mb-2">Or start a new pack list with this item</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`${item.name} trip`}
                    aria-label="New pack list name"
                    maxLength={80}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-mono text-xs font-bold px-4 flex items-center gap-1.5 transition"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    NEW
                  </button>
                </div>
              </form>

              <p className="pt-2 text-center">
                <Link href="/packs" className="text-xs font-semibold text-amber-400 hover:text-amber-300">Open my pack lists →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
