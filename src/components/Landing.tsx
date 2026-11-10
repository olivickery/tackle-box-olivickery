'use client';

import React, { useRef } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Fish,
  ListChecks,
  Lock,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Wand2,
  ZoomIn,
} from 'lucide-react';
import Wordmark from './Wordmark';
import LegalFooter from './LegalFooter';

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function AppIcon({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'w-24 h-24 sm:w-28 sm:h-28 text-[44px] sm:text-[52px]' : 'w-8 h-8 text-[15px]';
  return (
    <div
      className={`${box} shrink-0 rounded-[22%] bg-slate-950 border border-slate-800 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.35)] flex items-center justify-center font-extrabold tracking-tighter text-amber-500`}
      aria-hidden
    >
      IQ
    </div>
  );
}

/** A lure "photo" drawn with gradients, so the page shows no real user data. */
function LureSwatch({ from, to, className = '' }: { from: string; to: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md ${className}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <Fish className="absolute inset-0 m-auto w-1/2 h-1/2 text-white/70 -rotate-12" strokeWidth={1.5} />
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[220px] sm:w-[240px] aspect-[9/19] rounded-[2rem] border-[6px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden relative">
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-slate-800 z-10" />
      <div className="h-full pt-7 px-2.5 pb-3 flex flex-col gap-2 text-[9px] text-slate-300">{children}</div>
    </div>
  );
}

function MiniHeader() {
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-[11px]">
        <Wordmark />
      </span>
      <div className="flex gap-1">
        <span className="w-4 h-4 rounded bg-slate-800" />
        <span className="w-4 h-4 rounded bg-slate-800" />
      </div>
    </div>
  );
}

function AmberTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[7px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-px rounded">{children}</span>
  );
}

/* ------------------------------------------------------------------ */
/* Mock app screens for the preview carousel                           */
/* ------------------------------------------------------------------ */

function ScreenTray() {
  const lures = [
    { from: '#1e3a8a', to: '#dc2626', name: 'Popper 120', tag: 'Surf & Rock', fav: true },
    { from: '#065f46', to: '#a3e635', name: 'Shad 3"', tag: 'Estuary', fav: false },
    { from: '#78350f', to: '#fbbf24', name: 'Crank 50', tag: 'Freshwater', fav: true },
    { from: '#4c1d95', to: '#f472b6', name: 'Vibe 65', tag: 'Estuary', fav: false },
  ];
  return (
    <Phone>
      <MiniHeader />
      <div className="grid grid-cols-3 gap-1">
        {['36 Items', '6 Favs', '1 Restock'].map((t, i) => (
          <div key={t} className="rounded bg-slate-900 border border-slate-800 px-1 py-1">
            <span className={`block text-[8px] font-bold ${i === 1 ? 'text-amber-400' : i === 2 ? 'text-red-400' : 'text-slate-100'}`}>{t}</span>
          </div>
        ))}
      </div>
      <div className="rounded bg-slate-900 border border-slate-800 px-1.5 py-1 flex items-center gap-1 text-slate-500">
        <Search className="w-2.5 h-2.5" /> Search brand, species…
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {lures.map((l) => (
          <div key={l.name} className="rounded-lg bg-slate-900 border border-slate-800 p-1 flex flex-col gap-1">
            <div className="relative">
              <LureSwatch from={l.from} to={l.to} className="aspect-[4/3]" />
              {l.fav && <Star className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
            </div>
            <span className="text-[8px] font-bold text-slate-100 leading-none">{l.name}</span>
            <AmberTag>{l.tag}</AmberTag>
          </div>
        ))}
      </div>
    </Phone>
  );
}

function ScreenScan() {
  return (
    <Phone>
      <MiniHeader />
      <div className="relative rounded-lg overflow-hidden border border-slate-800">
        <LureSwatch from="#0f172a" to="#0369a1" className="aspect-[4/3] rounded-none" />
        <div className="absolute inset-3 border-2 border-amber-400/80 rounded-md" />
        <div className="absolute left-3 right-3 top-1/2 h-px bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" />
        <span className="absolute bottom-1 left-1 right-1 text-center bg-amber-500 text-slate-950 text-[7px] font-bold rounded py-0.5">
          Reading the packet…
        </span>
      </div>
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 space-y-1.5">
        {[
          ['Brand', 'Auto-filled'],
          ['Model', 'Auto-filled'],
          ['Colour', 'Auto-filled'],
          ['Specs', '9g · 90mm'],
          ['Species', 'Bass, Bream'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-slate-500">{k}</span>
            <span className="text-slate-100 flex items-center gap-1">
              <Wand2 className="w-2 h-2 text-amber-400" />
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-md bg-amber-500 text-slate-950 font-bold text-center py-1.5">Add to my gear</div>
    </Phone>
  );
}

function ScreenPlanner() {
  return (
    <Phone>
      <MiniHeader />
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 space-y-1">
        <span className="text-[7px] uppercase font-bold text-amber-400 block">Trip</span>
        <div className="flex items-center gap-1 text-slate-100">
          <MapPin className="w-2.5 h-2.5 text-amber-400" /> Estuary &amp; River
        </div>
        <div className="text-slate-400">Flathead, Bream · Overcast</div>
      </div>
      <div className="rounded-lg bg-slate-900 border border-amber-500/30 p-2 space-y-1">
        <span className="text-[7px] uppercase font-bold text-amber-400 flex items-center gap-1">
          <Sparkles className="w-2 h-2" /> Your loadout
        </span>
        <p className="text-slate-300 leading-snug">Work soft plastics slow along the drop-offs on the run-out tide…</p>
      </div>
      <div className="space-y-1">
        {[
          ['#065f46', '#a3e635', 'Shad 3"'],
          ['#4c1d95', '#f472b6', 'Vibe 65'],
          ['#78350f', '#fbbf24', 'Crank 50'],
        ].map(([f, t, n]) => (
          <div key={n} className="flex items-center gap-1.5 rounded bg-slate-900 border border-slate-800 p-1">
            <LureSwatch from={f} to={t} className="w-6 h-6 shrink-0" />
            <span className="text-slate-100 font-bold">{n}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-lg border border-dashed border-red-500/50 p-1.5 text-red-300">Gap: no heavy jig head for deeper water</div>
    </Phone>
  );
}

function ScreenRestock() {
  return (
    <Phone>
      <MiniHeader />
      <div className="flex items-center gap-1 px-1 text-[10px] font-bold text-slate-100">
        <ShoppingBag className="w-3 h-3 text-red-400" /> Items to replace
      </div>
      {[
        ['#1e3a8a', '#dc2626', 'Popper 120', 'Lost to a GT'],
        ['#0f172a', '#64748b', '10lb braid', 'Running low'],
        ['#78350f', '#fbbf24', 'Jig heads 1/8', 'Box empty'],
      ].map(([f, t, n, why]) => (
        <div key={n} className="flex items-center gap-1.5 rounded-lg border border-dashed border-red-500/50 bg-slate-900/60 p-1.5">
          <LureSwatch from={f} to={t} className="w-8 h-8 shrink-0 opacity-70" />
          <div>
            <span className="block text-slate-100 font-bold">{n}</span>
            <span className="text-slate-500">{why}</span>
          </div>
        </div>
      ))}
      <div className="mt-auto rounded-md bg-slate-800 text-slate-100 font-bold text-center py-1.5 flex items-center justify-center gap-1">
        <ListChecks className="w-3 h-3" /> Copy shopping list
      </div>
    </Phone>
  );
}

const PREVIEWS = [
  { caption: 'Your whole tackle box,', accent: 'in your pocket', Screen: ScreenTray },
  { caption: 'Snap the packet.', accent: 'AI fills in the rest', Screen: ScreenScan },
  { caption: 'Plan the trip,', accent: 'pack the right gear', Screen: ScreenPlanner },
  { caption: 'Never forget', accent: 'what to restock', Screen: ScreenRestock },
];

const FEATURES = [
  { Icon: Camera, title: 'Photo inventory', body: 'Up to four photos per item, swipe through them instantly and pinch to zoom in on the fine print.' },
  { Icon: Wand2, title: 'Packet scanning', body: 'Photograph the packaging and brand, model, colour, specs and target species are filled in for you.' },
  { Icon: Sparkles, title: 'AI trip planner', body: 'Tell it where you are fishing and what you are after. It builds a loadout from your own gear and flags what is missing.' },
  { Icon: Search, title: 'Find anything fast', body: 'Live search across brand, colour, specs, species and location, with filters you can stack.' },
  { Icon: ShoppingBag, title: 'Restock list', body: 'Mark lost or used-up gear and copy a ready-made shopping list for your next tackle shop run.' },
  { Icon: ZoomIn, title: 'Built for your phone', body: 'Designed mobile-first for the boat, the bank and the car park, and just as good on desktop.' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 1 | -1) => carouselRef.current?.scrollBy({ left: dir * 296, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon size="sm" />
            <span className="text-base">
              <Wordmark />
            </span>
          </div>
          <button onClick={onSignIn} className="text-xs font-mono font-bold text-slate-300 hover:text-white transition">
            SIGN IN
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {/* Hero */}
        <section className="pt-8 pb-6 flex gap-4 sm:gap-6 items-start">
          <AppIcon />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl leading-tight">
              <Wordmark />
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">Smart gear management</p>
            <p className="text-[11px] font-mono text-slate-500 mt-1 uppercase tracking-wide">Fishing · Gear inventory</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onGetStarted}
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold px-6 py-2.5 transition"
              >
                GET STARTED
              </button>
              <button
                onClick={onSignIn}
                className="rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-bold px-5 py-2.5 transition"
              >
                SIGN IN
              </button>
            </div>
          </div>
        </section>

        {/* Info strip */}
        <section className="grid grid-cols-4 divide-x divide-slate-800 border-y border-slate-800 py-3 text-center">
          {[
            ['Price', 'Free', ''],
            ['Built for', 'Anglers', ''],
            ['Works on', 'Phone', '& desktop'],
            ['Powered by', 'AI', 'trip planner'],
          ].map(([label, value, sub]) => (
            <div key={label} className="px-1">
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
              <span className="block text-base sm:text-lg font-bold text-slate-100 mt-0.5">{value}</span>
              <span className="block text-[10px] text-slate-500 h-3.5">{sub}</span>
            </div>
          ))}
        </section>

        {/* Preview carousel */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Preview</h2>
            <div className="hidden sm:flex gap-2">
              {([-1, 1] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => scrollCarousel(dir)}
                  aria-label={dir < 0 ? 'Previous screenshot' : 'Next screenshot'}
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 flex items-center justify-center transition"
                >
                  {dir < 0 ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <div ref={carouselRef} className="-mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PREVIEWS.map(({ caption, accent, Screen }) => (
              <figure
                key={caption}
                className="snap-center shrink-0 w-[260px] sm:w-[280px] rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 pt-5 pb-6 px-4"
              >
                <figcaption className="text-center text-[15px] font-bold leading-snug mb-4">
                  <span className="text-slate-100">{caption}</span>
                  <br />
                  <span className="text-amber-500">{accent}</span>
                </figcaption>
                <Screen />
              </figure>
            ))}
          </div>
        </section>

        {/* Description */}
        <section className="pb-8 border-b border-slate-800">
          <p className="text-sm text-slate-300 leading-relaxed">
            Tacklebox IQ keeps every lure, rod, reel and bit of terminal tackle you own in one place, with photos, specs and
            notes. No feeds, no catch maps, no clutter: just your gear, what it&apos;s good for, and what to bring next time.
          </p>
        </section>

        {/* Features */}
        <section className="py-8 border-b border-slate-800">
          <h2 className="text-lg font-bold mb-4">What it does</h2>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
            {FEATURES.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-500" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy */}
        <section className="py-8 border-b border-slate-800">
          <h2 className="text-lg font-bold mb-3">Your gear stays yours</h2>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex gap-3">
            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Every account is private: your gear list and notes are only visible to you when you&apos;re signed in. There&apos;s
              no feed and nothing is posted publicly. When you use the AI features, only the details needed for that request
              are sent to the AI service.
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-10 text-center">
          <div className="flex justify-center">
            <AppIcon />
          </div>
          <h2 className="text-xl font-bold mt-4">Ready to sort your tackle box?</h2>
          <p className="text-sm text-slate-400 mt-1">Free to use. Set up in a minute.</p>
          <button
            onClick={onGetStarted}
            className="mt-5 inline-flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold px-6 py-2.5 transition"
          >
            GET STARTED <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-slate-500 mt-4">
            Already have an account?{' '}
            <button onClick={onSignIn} className="text-slate-300 hover:text-white underline underline-offset-2">
              Sign in
            </button>
          </p>
        </section>
      </main>
      <LegalFooter />
    </div>
  );
}
