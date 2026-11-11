'use client';

import React, { useState } from 'react';
import {
  Check, ChevronLeft, ChevronRight, ExternalLink, Fish, Plus, Repeat, Share2,
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

/** Full-bleed colour for a tip's front face; graphics sit straight on top. */
function Stage({ from, to, children }: { from: string; to: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>
      <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-black/15 blur-2xl" />
      <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
      {children}
    </div>
  );
}

const glass = 'bg-white/15 border border-white/30 backdrop-blur-sm';

function IllAdd() {
  return (
    <Stage from="#1e3a8a" to="#0ea5e9">
      <div className="relative w-[60%] aspect-square">
        {/* viewfinder corners */}
        {['top-0 left-0 border-t-4 border-l-4 rounded-tl-xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
          'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl'].map(c => (
          <span key={c} className={`absolute w-8 h-8 border-white ${c}`} />
        ))}
        <span className="absolute left-1 right-1 top-1/2 h-0.5 bg-amber-300 shadow-[0_0_12px_3px_rgba(252,211,77,0.7)]" />
        <span className="absolute inset-0 m-auto w-14 h-14 rounded-2xl bg-white/25 border-2 border-white/80 backdrop-blur-sm text-white flex items-center justify-center shadow-xl ring-8 ring-white/15">
          <Plus className="w-8 h-8 stroke-[3]" />
        </span>
      </div>
    </Stage>
  );
}

function IllSwipe() {
  return (
    <Stage from="#065f46" to="#84cc16">
      <ChevronLeft className="absolute left-[7%] top-1/2 -translate-y-[60%] w-9 h-9 text-white" strokeWidth={3} />
      <ChevronRight className="absolute right-[7%] top-1/2 -translate-y-[60%] w-9 h-9 text-white" strokeWidth={3} />
      <div className="relative w-[52%] aspect-[4/5] -translate-y-[8%]">
        <div className={`absolute inset-0 translate-x-6 rotate-[8deg] rounded-2xl ${glass}`} />
        <div className="absolute inset-0 rounded-2xl bg-white/25 border-2 border-white/70 shadow-2xl flex items-center justify-center">
          <Fish className="w-[62%] h-[62%] text-white -rotate-12" strokeWidth={1.4} />
        </div>
      </div>
      <span className={`absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-sm font-mono font-bold tracking-wider text-white ${glass}`}>
        SWIPE
      </span>
    </Stage>
  );
}

function IllStar() {
  return (
    <Stage from="#9a3412" to="#fbbf24">
      <Fish className="w-[34%] h-[34%] text-white -rotate-12" strokeWidth={1.4} />
      <span className="absolute top-[14%] right-[14%] w-14 h-14 rounded-full bg-white text-amber-500 flex items-center justify-center shadow-xl ring-8 ring-white/25">
        <Star className="w-7 h-7 fill-current" />
      </span>
      <span className="absolute bottom-[16%] left-[14%] w-14 h-14 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl ring-8 ring-white/25">
        <Repeat className="w-7 h-7" />
      </span>
    </Stage>
  );
}

function IllPlan() {
  return (
    <Stage from="#5b21b6" to="#ec4899">
      <div className="w-[76%] space-y-2 font-mono">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-7 h-7" />
          <span className="text-base font-bold">Tactics</span>
        </div>
        {[['Shad 3"', true], ['Vibe 65', false], ['Leader', false]].map(([n, done]) => (
          <div key={n as string} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white ${glass}`}>
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done ? 'bg-white border-white' : 'border-white/80'}`}>
              {done && <Check className="w-3 h-3 text-violet-700" strokeWidth={4} />}
            </span>
            <span className={done ? 'line-through text-white/70' : ''}>{n as string}</span>
          </div>
        ))}
      </div>
    </Stage>
  );
}

function IllRestock() {
  return (
    <Stage from="#0f766e" to="#22d3ee">
      <div className="w-[78%] space-y-2 font-mono">
        <div className="flex items-center gap-2 text-white">
          <ShoppingBag className="w-7 h-7" />
          <span className="text-base font-bold">Restock</span>
        </div>
        {['Popper 120', '10lb braid'].map(n => (
          <div key={n} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white ${glass}`}>
            <span className="font-bold truncate">{n}</span>
            <span className="ml-auto flex items-center gap-0.5 shrink-0 text-[10px] font-bold">Amazon <ExternalLink className="w-3 h-3" /></span>
          </div>
        ))}
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white text-teal-800 text-xs font-bold py-1.5">
          <Share2 className="w-3.5 h-3.5" /> Share list
        </div>
      </div>
    </Stage>
  );
}

const STEPS: Step[] = [
  {
    id: 'add', title: 'Add your first gear', blurb: 'Take a pic of your item and AI will complete the specs.', action: 'Add gear', Illustration: IllAdd,
    how: ['Tap the yellow + button.', 'Take a photo of the packet (or the lure).', 'Brand, model, colour and specs fill in. Check them and save.'],
  },
  {
    id: 'swipe', title: 'Swipe your cards', blurb: 'Every item is a card. Swipe for more.', action: 'Try it', Illustration: IllSwipe,
    how: ['Swipe left on a card to move through photos.', 'Keep going for Specs, Notes and Manage.', 'Tap the magnifier on a photo to zoom right in.'],
  },
  {
    id: 'star', title: 'Star favourites, flag losses', blurb: '★ your go-to lures. ↻ when one’s lost.', Illustration: IllStar,
    how: ['Tap ★ on a card to make it a favourite.', 'Lost one to a snag? Tap ↻ to add it to your restock list.', 'Filter to favourites or items to replace with the pills (in list view on phones).'],
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
          <div className="absolute inset-0 bg-slate-900 px-5 pt-5 pb-8 font-mono flex flex-col justify-center">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400">How to</span>
            <ol className="mt-3 space-y-3 text-sm text-slate-100 leading-snug font-sans">
              {step.how.map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {side === 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950/70 text-white backdrop-blur-sm">
            TIP {index + 1}
          </span>
        )}
        <button
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-slate-950/70 text-white/90 hover:text-white backdrop-blur-sm transition"
          aria-label={`Dismiss tip: ${step.title}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

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

      <div className="mt-3 pt-2 border-t border-slate-800/60 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          onClick={() => flip(side === 0 ? 1 : 0)}
          className="justify-self-start text-[10px] font-mono uppercase text-slate-400 hover:text-slate-200 transition"
        >
          {side === 0 ? 'How to →' : '← Picture'}
        </button>
        {done ? (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
            <Check className="w-3 h-3" strokeWidth={3} /> DONE
          </span>
        ) : <span />}
        {step.action ? (
          <button
            onClick={step.id === 'swipe' ? () => flip(1) : onAction}
            className="justify-self-end text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            {step.action}
          </button>
        ) : (
          <button onClick={onDismiss} className="justify-self-end text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition">
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
        Explore the five tips below to get a feel for the features.
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
