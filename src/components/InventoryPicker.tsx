'use client';

import React, { useMemo, useState } from 'react';
import { Check, Package, Plus, Search, X } from 'lucide-react';
import type { PackEntry } from './PackChecklist';

export interface PickerItem extends PackEntry {
  type: string;
}

interface Props {
  items: PickerItem[];
  /** Gear ids already on the pack list (shown ticked and locked). */
  onListIds: Set<string>;
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}

/** Full-screen sheet for ticking gear from the user's tackle box to add to a pack list. */
export default function InventoryPicker({ items, onListIds, onAdd, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const types = useMemo(() => Array.from(new Set(items.map(i => i.type).filter(Boolean))).sort(), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(i => {
      if (typeFilter && i.type !== typeFilter) return false;
      if (!q) return true;
      return `${i.brand} ${i.name} ${i.detail}`.toLowerCase().includes(q);
    });
  }, [items, query, typeFilter]);

  const toggle = (id: string) => {
    if (onListIds.has(id)) return;
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[65] bg-slate-950/95 backdrop-blur-sm flex justify-center" role="dialog" aria-modal="true" aria-label="Add gear from your tackle box">
      <div className="w-full max-w-lg h-full flex flex-col bg-slate-900 sm:border-x border-slate-800 font-mono text-xs">
        {/* Header, search, type chips */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-sans font-bold text-lg text-slate-100">Add from your tackle box</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your gear..."
              aria-label="Search your gear"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-500 outline-none [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          {types.length > 1 && (
            <div className="-mx-4 px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[null, ...types].map(t => {
                const active = typeFilter === t;
                return (
                  <button
                    key={t ?? 'all'}
                    onClick={() => setTypeFilter(t)}
                    aria-pressed={active}
                    className={`shrink-0 px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                      active ? 'bg-slate-100 text-slate-950 border-slate-100 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {t ?? 'All'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrolling list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {visible.length === 0 ? (
            <p className="text-slate-500 text-center py-12">{items.length === 0 ? 'Your tackle box is empty.' : 'No gear matches.'}</p>
          ) : (
            <ul className="space-y-2">
              {visible.map(item => {
                const onList = onListIds.has(item.id);
                const isSelected = onList || selected.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      disabled={onList}
                      aria-pressed={isSelected}
                      className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition ${
                        onList
                          ? 'bg-slate-900 border-slate-800 opacity-60'
                          : isSelected
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                        onList ? 'bg-slate-600 border-slate-600 text-slate-900'
                          : isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </span>
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" loading="lazy" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                      ) : (
                        <span className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-500" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-slate-100">
                          {item.brand && <span className="text-amber-400">{item.brand} </span>}
                          {item.name}
                        </span>
                        {item.detail && <span className="block text-[10px] text-slate-500 truncate">{item.detail}</span>}
                      </span>
                      {onList && <span className="text-[10px] text-slate-400 shrink-0">On list</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pt-3 pb-8 sm:pb-4 border-t border-slate-800 flex gap-2 bg-slate-900">
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Cancel</button>
          <button
            onClick={() => onAdd(selected)}
            disabled={selected.length === 0}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            {selected.length === 0 ? 'Tick items to add' : `Add ${selected.length} ${selected.length === 1 ? 'item' : 'items'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
