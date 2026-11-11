'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ClipboardList, Package, Plus, RotateCcw, ShoppingBag, Trash2, Undo2, X } from 'lucide-react';
import InventoryPicker, { type PickerItem } from './InventoryPicker';

export interface PackEntry {
  id: string;
  brand: string;
  name: string;
  detail: string;
  image?: string;
  reason?: string;
  /** Added by the user rather than picked by the trip planner. */
  custom?: boolean;
  /** Set when a user-added item is gear from their tackle box. */
  gearId?: string;
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

/** "Re-add" button shown next to a gap that was removed from the restock list. */
export function ReAddGapButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 flex items-center gap-1 shrink-0 transition disabled:opacity-60"
    >
      <Undo2 className="w-3 h-3" /> {busy ? 'Adding…' : 'Re-add'}
    </button>
  );
}

const SWIPE_REMOVE_PX = 90;

/**
 * Row that can be swiped left to remove it. Vertical scrolling still works
 * (touch-action: pan-y); a swipe never counts as a tap. On wider screens a
 * trash button appears on hover instead.
 */
function SwipeRow({ onRemove, label, children }: { onRemove: () => void; label: string; children: React.ReactNode }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const isHorizontal = useRef(false);
  const suppressClick = useRef(false);
  const dxRef = useRef(0);

  const reset = () => {
    start.current = null;
    isHorizontal.current = false;
    setDragging(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    isHorizontal.current = false;
    suppressClick.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const ddx = e.clientX - start.current.x;
    const ddy = e.clientY - start.current.y;
    if (!isHorizontal.current) {
      if (Math.abs(ddy) > 10 && Math.abs(ddy) > Math.abs(ddx)) { start.current = null; return; }
      if (Math.abs(ddx) < 8 || Math.abs(ddx) < Math.abs(ddy)) return;
      isHorizontal.current = true;
      setDragging(true);
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    }
    suppressClick.current = true;
    dxRef.current = Math.min(0, ddx);
    setDx(dxRef.current);
  };

  const onPointerUp = () => {
    if (isHorizontal.current) {
      if (dxRef.current <= -SWIPE_REMOVE_PX) {
        setDx(-500);
        window.setTimeout(onRemove, 160);
      } else {
        setDx(0);
      }
      dxRef.current = 0;
    }
    reset();
  };

  const reveal = Math.min(1, -dx / SWIPE_REMOVE_PX);

  return (
    <li className="relative rounded-xl overflow-hidden group">
      {/* Revealed behind the row while swiping */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl bg-red-600 text-white font-bold gap-1.5"
        style={{ opacity: reveal }}
        aria-hidden="true"
      >
        <Trash2 className="w-4 h-4" /> Remove
      </div>
      <div
        className="relative flex items-stretch"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? 'none' : 'transform 160ms ease-out',
          touchAction: 'pan-y',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {children}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} from this list`}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition max-sm:sr-only sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

interface Props {
  /** Heading; defaults to "Pack checklist". */
  title?: string;
  tripLabel: string;
  entries: PackEntry[];
  gaps: PackGap[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
  onAddGaps: () => void;
  isAddingGaps: boolean;
  onReAddGap: (item: string) => void;
  reAddingGap: string | null;
  onRemoveEntry: (entry: PackEntry) => void;
  onRestoreEntry: (entry: PackEntry) => void;
  /** Tackle-box items removed from this list (restorable). */
  hiddenCount: number;
  onRestoreHidden: () => void;
  onAddCustom: (name: string) => void;
  /** Everything in the tackle box, for the add-gear picker. */
  inventory: PickerItem[];
  onAddFromInventory: (gearIds: string[]) => void;
  onClose: () => void;
}

/** Full-screen, thumb-friendly packing checklist built from a trip plan. */
export default function PackChecklist({
  title = 'Pack checklist', tripLabel, entries, gaps, checked, onToggle, onReset, onAddGaps, isAddingGaps,
  onReAddGap, reAddingGap, onRemoveEntry, onRestoreEntry, hiddenCount, onRestoreHidden, onAddCustom, inventory, onAddFromInventory, onClose,
}: Props) {
  const [customName, setCustomName] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<PackEntry | null>(null);

  useEffect(() => {
    if (!lastRemoved) return;
    const t = setTimeout(() => setLastRemoved(null), 5000);
    return () => clearTimeout(t);
  }, [lastRemoved]);

  const gearEntries = entries.filter(e => !e.custom);
  const customEntries = entries.filter(e => e.custom);
  const packed = entries.filter(e => checked.has(e.id)).length;
  const total = entries.length;
  const pct = total ? Math.round((packed / total) * 100) : 0;
  const allPacked = total > 0 && packed === total;
  const gapsToAdd = gaps.filter(g => g.status === 'pending').length;

  const remove = (entry: PackEntry) => {
    onRemoveEntry(entry);
    setLastRemoved(entry);
  };

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name) return;
    onAddCustom(name);
    setCustomName('');
  };

  const renderEntry = (entry: PackEntry) => {
    const isChecked = checked.has(entry.id);
    return (
      <SwipeRow key={entry.id} label={entry.name} onRemove={() => remove(entry)}>
        <button
          type="button"
          onClick={() => onToggle(entry.id)}
          aria-pressed={isChecked}
          className={`w-full text-left flex items-center gap-3 p-2.5 sm:pr-11 rounded-xl border transition select-none ${
            isChecked ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
            isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
          }`}>
            {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
          </span>
          {(!entry.custom || entry.gearId) && (entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image} alt="" draggable={false} className={`w-11 h-11 object-cover rounded-lg shrink-0 transition ${isChecked ? 'opacity-50' : ''}`} />
          ) : (
            <span className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-slate-500" />
            </span>
          ))}
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
      </SwipeRow>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl font-mono text-xs pb-12 sm:pb-6">
          {/* Header + progress */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur rounded-t-2xl px-5 pt-5 pb-4 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-sans font-bold text-lg text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400 shrink-0" /> <span className="truncate">{title}</span>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> From your tackle box
              </h3>
              {gearEntries.length > 0 && <span className="text-[10px] text-slate-500 sm:hidden">Swipe left to remove</span>}
            </div>
            {gearEntries.length === 0 ? (
              <p className="text-slate-500 py-2">No tackle box gear on this list.</p>
            ) : (
              <ul className="space-y-2">{gearEntries.map(renderEntry)}</ul>
            )}
            {hiddenCount > 0 && (
              <button onClick={onRestoreHidden} className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2">
                Restore {hiddenCount} removed {hiddenCount === 1 ? 'item' : 'items'}
              </button>
            )}
          </div>

          {/* Added by the user */}
          <div className="px-5 pt-5">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Added by you
            </h3>
            {customEntries.length > 0 && <ul className="space-y-2 mb-3">{customEntries.map(renderEntry)}</ul>}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-sans font-bold flex items-center justify-center gap-2 transition"
            >
              <Package className="w-4 h-4" /> Add from your tackle box
            </button>
            <form onSubmit={submitCustom} className="flex gap-2 mt-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Other: sunscreen, bait…"
                maxLength={60}
                aria-label="Add something that isn't in your tackle box"
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
              />
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
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
                      {gap.status === 'removed'
                        ? <ReAddGapButton onClick={() => onReAddGap(gap.item)} busy={reAddingGap === gap.item} />
                        : <GapStatusTag status={gap.status} />}
                    </div>
                    {gap.status === 'removed' && <p className="text-[10px] text-red-400/80 mt-0.5">Removed from restock list</p>}
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

      {isPickerOpen && (
        <InventoryPicker
          items={inventory}
          onListIds={new Set(entries.map(e => e.gearId ?? (e.custom ? '' : e.id)).filter(Boolean))}
          onAdd={(ids) => { onAddFromInventory(ids); setIsPickerOpen(false); }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      {/* Undo after a removal */}
      {lastRemoved && (
        <div className="fixed bottom-6 inset-x-4 z-[61] flex justify-center pointer-events-none" role="status" aria-live="polite">
          <div className="pointer-events-auto max-w-sm w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-2 py-2 shadow-2xl font-mono text-xs">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1 min-w-0 text-slate-200 truncate">Removed {lastRemoved.name}</span>
            <button
              onClick={() => { onRestoreEntry(lastRemoved); setLastRemoved(null); }}
              className="shrink-0 px-3 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 font-bold uppercase"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
