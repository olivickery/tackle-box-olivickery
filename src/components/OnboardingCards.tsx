'use client';

import React, { useState } from 'react';
import {
  Camera, Check, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Fish, Plus, Repeat, Share2,
  ShoppingBag, Sparkles, Star, X,
} from 'lucide-react';

export type OnboardingStepId = 'add' | 'swipe' | 'star' | 'plan' | 'restock';

interface Step {
  id: OnboardingStepId;
  title: string;
  blurb: string;
  how: string[];
  action?: string;
  Illustration: () => React.ReactElement;
}

/* ------------------------------------------------------------------ */
/* Illustrations, drawn in the overview-page style (no photos)         */
/* ------------------------------------------------------------------ */

function Lure({ from, to, className = '' }: { from: string; to: string; className?: string }) {
  return (
    <div className={`${className.includes('absolute') ? '' : 'relative'} overflow-hidden rounded-md ${className}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <Fish className="absolute inset-0 m-auto w-1/2 h-1/2 text-white/70 -rotate-12" strokeWidth={1.5} />
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl" />
      {children}
    </div>
  );
}

function IllAdd() {
  return (
    <Stage>
      <div className="relative w-[58%] aspect-[3/4] rounded-xl border-2 border-slate-700 bg-slate-950 p-2 flex flex-col">
        <div className="relative flex-1 rounded-md overflow-hidden">
          <Lure from="#1e3a8a" to="#0ea5e9" className="absolute inset-0 rounded-none" />
          <div className="absolute inset-2 border-2 border-amber-400/80 rounded" />
          <div className="absolute left-2 right-2 top-1/2 h-px bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" />
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8px] font-mono font-bold text-amber-400">
          <Camera className="w-2.5 h-2.5" /> Reading the packet…
        </div>
      </div>
      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <Plus className="w-5 h-5 stroke-[3]" />
      </div>
    </Stage>
  );
}

function IllSwipe() {
  return (
    <Stage>
      <div className="relative w-[62%] aspect-square">
        <div className="absolute inset-0 translate-x-5 rotate-6 rounded-lg bg-slate-800 border border-slate-700 p-2 font-mono text-[7px] text-slate-400 space-y-1">
          <span className="block text-[8px] font-bold text-slate-200">SPECS</span>
          <span className="block">Brand · Daiwa</span><span className="block">Depth · 1.5m</span><span className="block">Species · Bass</span>
        </div>
        <div className="absolute inset-0 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
          <Lure from="#065f46" to="#a3e635" className="absolute inset-0 rounded-none" />
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
            <span className="w-3 h-1.5 rounded-full bg-white" /><span className="w-1.5 h-1.5 rounded-full bg-white/50" /><span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-950/90 border border-slate-700 px-2.5 py-1 text-[9px] font-mono font-bold text-amber-400">
        <ChevronLeft className="w-3 h-3" /> SWIPE <ChevronRight className="w-3 h-3" />
      </div>
    </Stage>
  );
}

function IllStar() {
  return (
    <Stage>
      <div className="relative w-[64%] aspect-square rounded-lg overflow-hidden border border-slate-700 shadow-xl">
        <Lure from="#78350f" to="#fbbf24" className="absolute inset-0 rounded-none" />
        <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center ring-4 ring-amber-500/30">
          <Star className="w-3.5 h-3.5 fill-current" />
        </span>
        <span className="absolute bottom-1.5 left-1.5 w-7 h-7 rounded-full bg-slate-900/90 border border-slate-600 text-red-300 flex items-center justify-center ring-4 ring-red-500/25">
          <Repeat className="w-3.5 h-3.5" />
        </span>
      </div>
    </Stage>
  );
}

function IllPlan() {
  return (
    <Stage>
      <div className="w-[70%] space-y-1 text-[8px] font-mono">
        <div className="rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-slate-300 truncate">Fishing: <span className="text-amber-400">Estuary</span></div>
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1">
          <span className="flex items-center gap-1 font-bold text-amber-400"><Sparkles className="w-2.5 h-2.5" /> TACTICS</span>
          <span className="block text-slate-300 mt-0.5 font-sans leading-snug truncate">Slow-roll vibes on the run-out tide…</span>
        </div>
        {['Shad 3"', 'Vibe 65'].map((n, i) => (
          <div key={n} className="flex items-center gap-1.5 rounded-md bg-slate-950 border border-slate-800 px-1.5 py-1">
            <span className={`w-3 h-3 rounded border flex items-center justify-center ${i === 0 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
              {i === 0 && <Check className="w-2 h-2 text-slate-950" strokeWidth={4} />}
            </span>
            <span className={i === 0 ? 'text-slate-500 line-through' : 'text-slate-200'}>{n}</span>
            <ClipboardList className="w-2.5 h-2.5 ml-auto text-slate-600" />
          </div>
        ))}
      </div>
    </Stage>
  );
}

function IllRestock() {
  return (
    <Stage>
      <div className="w-[72%] space-y-1.5 text-[8px] font-mono">
        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-200"><ShoppingBag className="w-3 h-3 text-red-400" /> RESTOCK</span>
        {[['#1e3a8a', '#dc2626', 'Popper 120'], ['#0f172a', '#64748b', '10lb braid']].map(([f, t, n]) => (
          <div key={n} className="flex items-center gap-1.5 rounded-md border border-dashed border-red-500/40 bg-slate-950 p-1">
            <Lure from={f} to={t} className="w-5 h-5 shrink-0 opacity-80" />
            <span className="text-slate-200 font-bold">{n}</span>
            <span className="ml-auto flex items-center gap-0.5 rounded bg-slate-800 border border-slate-700 px-1 py-px text-amber-400">Amazon <ExternalLink className="w-2 h-2" /></span>
          </div>
        ))}
        <div className="flex items-center justify-center gap-1 rounded-md bg-amber-500 text-slate-950 font-bold py-1"><Share2 className="w-2.5 h-2.5" /> Share list</div>
      </div>
    </Stage>
  );
}

const STEPS: Step[] = [
  {
    id: 'add', title: 'Add your first gear', blurb: 'Snap the packet and the details fill in.', action: 'Add gear', Illustration: IllAdd,
    how: ['Tap the yellow + button.', 'Take a photo of the packet (or the lure).', 'Brand, model, colour and specs fill in. Check them and save.'],
  },
  {
    id: 'swipe', title: 'Swipe your cards', blurb: 'Every item is a card. Swipe for more.', action: 'Try it', Illustration: IllSwipe,
    how: ['Swipe left on a card to move through photos.', 'Keep going for Specs, Notes and Manage.', 'Tap the magnifier on a photo to zoom right in.'],
  },
  {
    id: 'star', title: 'Star favourites, flag losses', blurb: '★ your go-to lures. ↻ when one’s lost.', Illustration: IllStar,
    how: ['Tap ★ on a card to make it a favourite.', 'Lost one to a snag? Tap ↻ to add it to your restock list.', 'Use the pills under the search bar to filter.'],
  },
  {
    id: 'plan', title: 'Plan a trip', blurb: 'Tactics, a loadout and a pack list.', action: 'Plan a trip', Illustration: IllPlan,
    how: ['Tap Plan and say where, what and the conditions.', 'Get tactics and picks from your own gear.', 'Open the pack checklist, tick things off and save it.'],
  },
  {
    id: 'restock', title: 'Restock and share', blurb: 'Buy what’s missing, or send the list.', action: 'Open restock', Illustration: IllRestock,
    how: ['Tap Restock to see everything you need.', 'Find each item on Amazon in one tap.', 'Share list sends a link to whoever’s buying.'],
  },
];

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

function TipCard({
  step, index, done, onAction, onDismiss, onSwiped,
}: {
  step: Step; index: number; done: boolean;
  onAction: () => void; onDismiss: () => void; onSwiped: () => void;
}) {
  const [side, setSide] = useState<0 | 1>(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const flip = (to: 0 | 1) => {
    setSide(to);
    if (to === 1) onSwiped();
  };

  return (
    <div className={`relative group rounded-xl p-3 border transition ${done ? 'bg-slate-900/60 border-emerald-500/30' : 'bg-slate-900/80 border-amber-500/30 shadow-lg shadow-amber-500/5'}`}>
      <div
        className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80 select-none"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (dx < -40) flip(1);
          if (dx > 40) flip(0);
          setTouchX(null);
        }}
      >
        {side === 0 ? (
          <step.Illustration />
        ) : (
          <div className="absolute inset-0 bg-slate-900/95 p-4 font-mono text-xs flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">How to</span>
            <ol className="mt-2 space-y-2 text-[11px] text-slate-200 leading-snug font-sans">
              {step.how.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-4 h-4 shrink-0 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center mt-px">{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <span className="absolute top-2 left-2 z-10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300">
          TIP {index + 1}
        </span>
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-400 hover:text-slate-100 transition"
          aria-label={`Dismiss tip: ${step.title}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {done && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
            <Check className="w-3 h-3" strokeWidth={3} /> DONE
          </span>
        )}

        {/* Desktop arrows + dots, like gear cards */}
        <button onClick={() => flip(side === 0 ? 1 : 0)} className="hidden sm:block absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700/60 opacity-0 group-hover:opacity-100 transition z-10" aria-label={side === 0 ? 'How to' : 'Back to picture'}>
          {side === 0 ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className={`h-1.5 rounded-full transition-all ${side === 0 ? 'w-3 bg-white' : 'w-1.5 bg-slate-600'}`} />
            <span className={`h-1.5 rounded-full transition-all ${side === 1 ? 'w-3 bg-white' : 'w-1.5 bg-slate-600'}`} />
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-slate-100">{step.title}</h3>
      <p className="text-xs text-slate-400 mt-0.5">{step.blurb}</p>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <button
          onClick={() => flip(side === 0 ? 1 : 0)}
          className="text-[10px] font-mono uppercase text-slate-400 hover:text-slate-200 transition"
        >
          {side === 0 ? 'How to →' : '← Picture'}
        </button>
        {step.action ? (
          <button
            onClick={step.id === 'swipe' ? () => flip(1) : onAction}
            className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            {step.action}
          </button>
        ) : (
          <button onClick={onDismiss} className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition">
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export default function OnboardingCards({
  visibleIds, doneIds, onAction, onDismiss, onHideAll, onSwiped,
}: {
  visibleIds: OnboardingStepId[];
  doneIds: Set<OnboardingStepId>;
  onAction: (id: OnboardingStepId) => void;
  onDismiss: (id: OnboardingStepId) => void;
  onHideAll: () => void;
  onSwiped: () => void;
}) {
  const steps = STEPS.filter(s => visibleIds.includes(s.id));
  if (steps.length === 0) return null;
  return (
    <section className="bg-slate-900/40 p-4 rounded-2xl border border-amber-500/20 backdrop-blur-sm" aria-label="Getting started tips">
      <div className="flex items-center justify-between mb-4 gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Getting started
        </span>
        <button onClick={onHideAll} className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition">Hide all tips</button>
      </div>
      <p className="text-xs text-slate-400 -mt-2 mb-4">
        These work just like your gear cards: swipe one (or tap <span className="text-slate-200">How to</span>) to see the back.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map(step => (
          <TipCard
            key={step.id}
            step={step}
            index={STEPS.findIndex(s => s.id === step.id)}
            done={doneIds.has(step.id)}
            onAction={() => onAction(step.id)}
            onDismiss={() => onDismiss(step.id)}
            onSwiped={onSwiped}
          />
        ))}
      </div>
    </section>
  );
}

export const ONBOARDING_STEP_IDS: OnboardingStepId[] = STEPS.map(s => s.id);
