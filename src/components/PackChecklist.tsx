'use client';

import React from 'react';
import { Check, ClipboardList, Package, ShoppingBag, X, RotateCcw } from 'lucide-react';

export interface PackEntry {
  id: string;
  brand: string;
  name: string;
  detail: string;
  image?: string;
  reason?: string;
}

export type GapStatus = 'pending' | 'on-list' | 'bought' | 'removed';

export interface PackGap {
  item: string;
  type: string;
  reason: string;
  status: GapStatus;
}

/** Small status label for a gap item; renders nothing until it's been added. */
export function GapStatusTag({ status }: { status: GapStatus }) {
  if (status === 'pending') return null;
  const styles: Record<Exclude<GapStatus, 'pending'>, { cls: string; label: string; Icon: typeof Check }> = {
    'on-list': { cls: 'text-emerald-400', label: 'On restock list', Icon: Check },
    bought: { cls: 'text-emerald-400', label: 'Bought', Icon: Check },
    removed: { cls: 'text-red-400', label: 'Removed from restock list', Icon: X },
  };
  const { cls, label, Icon } = styles[status];
  return (
    <span className={`text-[10px] font-mono flex items-center gap-1 shrink-0 ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

interface Props {
  tripLabel: string;
  entries: PackEntry[];
  gaps: PackGap[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
  onAddGaps: () => void;
  isAddingGaps: boolean;
  onClose: () => void;
}

/** Full-screen, thumb-friendly packing checklist built from a trip plan. */
export default function PackChecklist({
  tripLabel, entries, gaps, checked, onToggle, onReset, onAddGaps, isAddingGaps, onClose,
}: Props) {
  const packed = entries.filter(e => checked.has(e.id)).length;
  const total = entries.length;
  const pct = total ? Math.round((packed / total) * 100) : 0;
  const allPacked = total > 0 && packed === total;
  const gapsToAdd = gaps.filter(g => g.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-label="Pack checklist">
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl font-mono text-xs pb-12 sm:pb-6">
          {/* Header + progress */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur rounded-t-2xl px-5 pt-5 pb-4 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-sans font-bold text-lg text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400 shrink-0" /> Pack checklist
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tripLabel}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800 shrink-0" aria-label="Close checklist">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className={allPacked ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {allPacked ? 'All packed. Tight lines!' : `${packed} of ${total} packed`}
                </span>
                <span className="text-slate-500">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all duration-300 ${allPacked ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Gear to pack */}
          <div className="px-5 pt-4">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> From your tackle box
            </h3>
            {total === 0 ? (
              <p className="text-slate-500 py-4">No gear picked for this trip yet.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map(entry => {
                  const isChecked = checked.has(entry.id);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(entry.id)}
                        aria-pressed={isChecked}
                        className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl border transition ${
                          isChecked
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </span>
                        {entry.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.image} alt="" className={`w-11 h-11 object-cover rounded-lg shrink-0 transition ${isChecked ? 'opacity-50' : ''}`} />
                        ) : (
                          <span className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-500" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate ${isChecked ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                            {entry.brand && <span className={isChecked ? '' : 'text-amber-400'}>{entry.brand} </span>}
                            {entry.name}
                          </span>
                          {entry.detail && <span className="block text-[10px] text-slate-500 truncate">{entry.detail}</span>}
                          {entry.reason && !isChecked && (
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5 leading-snug">{entry.reason}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="px-5 pt-5">
              <h3 className="text-[10px] uppercase font-bold text-red-400 mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Not in your tackle box
              </h3>
              <ul className="space-y-2">
                {gaps.map((gap, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl border border-dashed border-red-500/30 bg-slate-950">
                    <div className="flex items-center justify-between gap-2">
                      <span className={gap.status === 'removed' ? 'text-slate-500 line-through' : 'text-slate-200'}>{gap.item}</span>
                      <GapStatusTag status={gap.status} />
                    </div>
                    {gap.reason && <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-snug">{gap.reason}</p>}
                  </li>
                ))}
              </ul>
              {gapsToAdd > 0 && (
                <button
                  onClick={onAddGaps}
                  disabled={isAddingGaps}
                  className="mt-3 w-full py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isAddingGaps ? 'Adding…' : `Add ${gapsToAdd === 1 ? '1 item' : `${gapsToAdd} items`} to restock list`}
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 pt-6 flex gap-2">
            <button
              onClick={onReset}
              disabled={packed === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Uncheck all
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
