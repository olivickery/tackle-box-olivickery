'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, Calendar, ClipboardList, Edit3, Loader2, MapPin, Fish, Sparkles, Star, Trash2, X, AlertTriangle,
} from 'lucide-react';
import AuthGate from '../../components/AuthGate';
import Wordmark from '../../components/Wordmark';
import LegalFooter from '../../components/LegalFooter';
import PackChecklist, { type PackEntry } from '../../components/PackChecklist';
import { supabase } from '../../lib/supabase';
import {
  type GearItem, type PackList,
  formatGearRow, formatPackRow, buildPackEntries, buildPackGaps, addGapsToRestock, countHiddenGear, newCustomItem,
} from '../../lib/gear';

type SortKey = 'trip-date' | 'newest' | 'name' | 'species' | 'location';

const SORT_LABELS: Record<SortKey, string> = {
  'trip-date': 'Trip date',
  newest: 'Recently saved',
  name: 'Name (A–Z)',
  species: 'Species',
  location: 'Location',
};

function formatTripDate(d: string | null): string {
  if (!d) return '';
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PacksPage() {
  return <AuthGate>{(session) => <SavedPacks session={session} />}</AuthGate>;
}

function SavedPacks({ session }: { session: Session }) {
  const [packs, setPacks] = useState<PackList[]>([]);
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('trip-date');
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const [openPackId, setOpenPackId] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<PackList | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [packToDelete, setPackToDelete] = useState<PackList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingGaps, setIsAddingGaps] = useState(false);
  const [reAddingGap, setReAddingGap] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [packsRes, gearRes] = await Promise.all([
        supabase.from('pack_lists').select('*').order('created_at', { ascending: false }),
        supabase.from('gear_items').select('*'),
      ]);
      if (cancelled) return;
      if (packsRes.error) {
        console.error('Failed to load pack lists:', packsRes.error);
        setLoadError(packsRes.error.message);
      } else {
        setPacks((packsRes.data || []).map(formatPackRow));
      }
      if (!gearRes.error) setItems((gearRes.data || []).map(formatGearRow));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const sortedPacks = useMemo(() => {
    const list = favouritesOnly ? packs.filter(p => p.is_favorite) : [...packs];
    const text = (v: string | null | undefined) => (v || '').toLowerCase();
    list.sort((a, b) => {
      switch (sortKey) {
        case 'trip-date': {
          // Dated trips first (soonest first), then undated by most recently saved.
          if (a.trip_date && b.trip_date) return a.trip_date.localeCompare(b.trip_date);
          if (a.trip_date) return -1;
          if (b.trip_date) return 1;
          return b.created_at.localeCompare(a.created_at);
        }
        case 'newest': return b.created_at.localeCompare(a.created_at);
        case 'name': return text(a.title).localeCompare(text(b.title));
        case 'species': return text(a.species.join(', ')).localeCompare(text(b.species.join(', '))) || text(a.title).localeCompare(text(b.title));
        case 'location': return text(a.location).localeCompare(text(b.location)) || text(a.title).localeCompare(text(b.title));
      }
    });
    return list;
  }, [packs, sortKey, favouritesOnly]);

  const updatePack = async (id: string, changes: Partial<PackList>) => {
    const previous = packs;
    setPacks(prev => prev.map(p => (p.id === id ? { ...p, ...changes } : p)));
    const { error } = await supabase.from('pack_lists').update(changes).eq('id', id);
    if (error) {
      console.error('Failed to update pack list:', error);
      alert(`Couldn't save that change: ${error.message}`);
      setPacks(previous);
      return false;
    }
    return true;
  };

  const openEdit = (pack: PackList) => {
    setEditingPack(pack);
    setEditTitle(pack.title);
    setEditDate(pack.trip_date || '');
  };

  const saveEdit = async () => {
    if (!editingPack || !editTitle.trim()) return;
    setIsSavingEdit(true);
    const ok = await updatePack(editingPack.id, { title: editTitle.trim(), trip_date: editDate || null });
    setIsSavingEdit(false);
    if (ok) setEditingPack(null);
  };

  const confirmDelete = async () => {
    if (!packToDelete) return;
    setIsDeleting(true);
    const { error } = await supabase.from('pack_lists').delete().eq('id', packToDelete.id);
    setIsDeleting(false);
    if (error) {
      alert(`Couldn't delete the pack list: ${error.message}`);
      return;
    }
    setPacks(prev => prev.filter(p => p.id !== packToDelete.id));
    setPackToDelete(null);
  };

  const openPack = packs.find(p => p.id === openPackId) || null;
  const openEntries = buildPackEntries(openPack?.plan ?? null, items, {
    hidden: openPack?.hidden_items, custom: openPack?.custom_items,
  });
  const openGaps = buildPackGaps(openPack?.plan ?? null, openPack?.added_gaps ?? [], items, loading);

  const togglePacked = (id: string) => {
    if (!openPack) return;
    const checked = openPack.checked.includes(id) ? openPack.checked.filter(x => x !== id) : [...openPack.checked, id];
    updatePack(openPack.id, { checked });
  };

  const removeEntry = (entry: PackEntry) => {
    if (!openPack) return;
    const checked = openPack.checked.filter(id => id !== entry.id);
    if (entry.custom) {
      updatePack(openPack.id, { custom_items: openPack.custom_items.filter(c => c.id !== entry.id), checked });
    } else if (!openPack.hidden_items.includes(entry.id)) {
      updatePack(openPack.id, { hidden_items: [...openPack.hidden_items, entry.id], checked });
    }
  };

  const restoreEntry = (entry: PackEntry) => {
    if (!openPack) return;
    if (entry.custom) {
      if (!openPack.custom_items.some(c => c.id === entry.id)) {
        updatePack(openPack.id, { custom_items: [...openPack.custom_items, { id: entry.id, name: entry.name }] });
      }
    } else {
      updatePack(openPack.id, { hidden_items: openPack.hidden_items.filter(id => id !== entry.id) });
    }
  };

  const reAddGap = async (gapName: string) => {
    if (!openPack || reAddingGap) return;
    setReAddingGap(gapName);
    const result = await addGapsToRestock({
      userId: session.user.id,
      plan: openPack.plan,
      addedGaps: openPack.added_gaps,
      items,
      location: openPack.location || '',
      species: openPack.species,
      only: [gapName],
    });
    setReAddingGap(null);
    if (result.error) {
      alert(`Couldn't add it back to your restock list: ${result.error}`);
      return;
    }
    if (result.inserted.length) setItems(prev => [...result.inserted, ...prev]);
  };

  const addOpenGaps = async () => {
    if (!openPack || isAddingGaps) return;
    setIsAddingGaps(true);
    const result = await addGapsToRestock({
      userId: session.user.id,
      plan: openPack.plan,
      addedGaps: openPack.added_gaps,
      items,
      location: openPack.location || '',
      species: openPack.species,
    });
    setIsAddingGaps(false);
    if (result.error) {
      alert(`Couldn't add to your restock list: ${result.error}`);
      return;
    }
    if (result.inserted.length) setItems(prev => [...result.inserted, ...prev]);
    if (result.newlyAdded.length) updatePack(openPack.id, { added_gaps: [...openPack.added_gaps, ...result.newlyAdded] });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0 text-slate-300 hover:text-white transition" aria-label="Back to my gear">
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-base sm:text-lg leading-none"><Wordmark /></span>
          </Link>
          <Link
            href="/?planner=1"
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" /> PLAN TRIP
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-16">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-amber-500" /> My pack lists
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Saved trip plans and packing checklists.</p>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs">
          <label htmlFor="pack-sort" className="text-slate-500">Sort by</label>
          <select
            id="pack-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-3 text-base sm:text-xs text-slate-100 focus:border-amber-500 outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
          <button
            onClick={() => setFavouritesOnly(v => !v)}
            aria-pressed={favouritesOnly}
            className={`ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full border transition ${
              favouritesOnly ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" /> Favourites
          </button>
        </div>

        {/* List */}
        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center py-16 text-slate-500 font-mono text-xs">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-3" /> Loading your pack lists…
            </div>
          ) : loadError ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-xs font-mono">
              Couldn&apos;t load your pack lists. Please refresh and try again.
            </div>
          ) : sortedPacks.length === 0 ? (
            <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-slate-800 font-mono text-xs text-slate-400">
              {favouritesOnly ? (
                <p>No favourite pack lists yet. Tap the star on a list to add it.</p>
              ) : (
                <>
                  <p>No saved pack lists yet.</p>
                  <p className="mt-1">Plan a trip, then tap <span className="text-slate-200">Save pack list</span>.</p>
                  <Link href="/?planner=1" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold transition">
                    <Sparkles className="w-4 h-4" /> Plan a trip
                  </Link>
                </>
              )}
            </div>
          ) : (
            sortedPacks.map(pack => {
              const entries = buildPackEntries(pack.plan, items, { hidden: pack.hidden_items, custom: pack.custom_items });
              const packed = pack.checked.filter(id => entries.some(e => e.id === id)).length;
              const pct = entries.length ? Math.round((packed / entries.length) * 100) : 0;
              const done = entries.length > 0 && packed === entries.length;
              return (
                <article key={pack.id} className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setOpenPackId(pack.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <h2 className="font-bold text-base text-slate-100 leading-snug">{pack.title}</h2>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
                        {pack.trip_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatTripDate(pack.trip_date)}</span>}
                        {pack.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pack.location}</span>}
                        {pack.species.length > 0 && <span className="flex items-center gap-1"><Fish className="w-3 h-3" /> {pack.species.join(', ')}</span>}
                      </div>
                    </button>
                    <button
                      onClick={() => updatePack(pack.id, { is_favorite: !pack.is_favorite })}
                      className={`p-1.5 rounded-full border transition shrink-0 ${
                        pack.is_favorite ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-500 border-slate-700 hover:text-slate-200'
                      }`}
                      aria-label={pack.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
                      aria-pressed={pack.is_favorite}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 font-mono text-[11px]">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={done ? 'text-emerald-400' : 'text-slate-400'}>
                      {entries.length ? `${packed}/${entries.length} packed` : 'No gear'}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 font-mono text-xs">
                    <button
                      onClick={() => setOpenPackId(pack.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-sans font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <ClipboardList className="w-4 h-4" /> Open
                    </button>
                    <button
                      onClick={() => openEdit(pack)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setPackToDelete(pack)}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-1.5 transition"
                      aria-label={`Delete ${pack.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      <LegalFooter />

      {/* Checklist */}
      {openPack && (
        <PackChecklist
          title={openPack.title}
          tripLabel={[formatTripDate(openPack.trip_date), openPack.location, openPack.species.join(', '), openPack.conditions].filter(Boolean).join(' · ')}
          entries={openEntries}
          gaps={openGaps}
          checked={new Set(openPack.checked)}
          onToggle={togglePacked}
          onReset={() => updatePack(openPack.id, { checked: [] })}
          onAddGaps={addOpenGaps}
          isAddingGaps={isAddingGaps}
          onReAddGap={reAddGap}
          reAddingGap={reAddingGap}
          onRemoveEntry={removeEntry}
          onRestoreEntry={restoreEntry}
          hiddenCount={countHiddenGear(openPack.plan, items, openPack.hidden_items)}
          onRestoreHidden={() => updatePack(openPack.id, { hidden_items: [] })}
          onAddCustom={(name) => updatePack(openPack.id, { custom_items: [...openPack.custom_items, newCustomItem(name)] })}
          onClose={() => setOpenPackId(null)}
        />
      )}

      {/* Rename / date */}
      {editingPack && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4 pb-12">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans font-bold text-lg text-slate-100">Edit pack list</h2>
                <button onClick={() => setEditingPack(null)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <label htmlFor="edit-title" className="block text-slate-400 mb-1.5 uppercase font-bold text-[10px]">Name</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={80}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none text-base sm:text-xs"
              />
              <label htmlFor="edit-date" className="block text-slate-400 mt-4 mb-1.5 uppercase font-bold text-[10px]">Trip date (optional)</label>
              <div className="flex gap-2">
                <input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none text-base sm:text-xs [color-scheme:dark]"
                />
                {editDate && (
                  <button onClick={() => setEditDate('')} className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">Clear</button>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setEditingPack(null)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Cancel</button>
                <button
                  onClick={saveEdit}
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {packToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Delete this pack list?</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              <span className="text-slate-200 font-bold">{packToDelete.title}</span> will be deleted. Your gear and restock list aren&apos;t affected.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPackToDelete(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2.5 rounded-xl transition">Cancel</button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
