'use client';

import React, { useState } from 'react';
import { Anchor, Shield, Navigation, Flame, Zap, Crosshair } from 'lucide-react';

// Sample Inventory Data (Synced with your gear)
const INITIAL_GEAR = [
  {
    id: '1',
    name: 'The Sniper',
    brand: 'Shimano Raider 703 Travel',
    category: 'Rod & Reel Outfit',
    depth: '1.2m - 2.1m',
    line: '6lb Braid / 8lb Leader',
    target: 'Bream, Flathead, Yellowbelly',
    tripSuitability: ['Tuggerah Lake', 'Lake Windamere'],
    tacticalTip: 'Walk the sand flats or bridge shadow lines. Pair with 4.9g Money Badger or 2.5" plastics. Crank down and use a slow-rise pause on structure.',
    bgGradient: 'from-blue-900 to-slate-900',
    badge: 'Finesse Estuary'
  },
  {
    id: '2',
    name: 'Money Badger 40mm',
    brand: 'Berkley Pro-Tech (Firetail Silver Craw)',
    category: 'Hardbody Lure',
    depth: '1.2m - 2.1m',
    line: '6lb - 8lb Fluorocarbon Leader',
    target: 'Bream, Big Flathead',
    tripSuitability: ['Tuggerah Lake', 'Lake Windamere'],
    tacticalTip: 'Cast at 45° to clay banks or bridge pylons. Crank down so the bib bumps structure, then pause—fish hammer it on the float up.',
    bgGradient: 'from-amber-900 to-slate-900',
    badge: 'Slow-Rise Hardbody'
  },
  {
    id: '3',
    name: 'The Wanderer',
    brand: 'Penn Prevail II 10\'6" + Fierce IV 4000',
    category: 'Surf & Heavy Estuary',
    depth: 'Topwater / Wash',
    line: '15lb Daiwa J-Braid',
    target: 'Tailor, Australian Salmon, Flathead',
    tripSuitability: ['Tuggerah Lake (Firepit)', 'North Entrance Beach'],
    tacticalTip: 'Ideal for 30g-60g metals into surf gutters. Alternatively, set up with a clip-on bell by the garden firepit for night bait soaking.',
    bgGradient: 'from-emerald-900 to-slate-900',
    badge: 'Mobile Surf & Firepit'
  },
  {
    id: '4',
    name: 'The Cannon',
    brand: 'Penn Prevail 13ft',
    category: 'Heavy Surf',
    depth: 'Deep Gutters',
    line: '25lb Super Schneider Mono',
    target: 'Mulloway, Big Tailor, Rays',
    tripSuitability: ['North Entrance Beach', 'Avalon Beach'],
    tacticalTip: 'Built for launching 3oz-5oz star sinkers over heavy ocean swells. Run a 3-way swivel or running sinker rig with fresh squid or worms.',
    bgGradient: 'from-red-950 to-slate-900',
    badge: 'Heavy Ordnance'
  }
];

export default function GearCatalog() {
  const [filter, setFilter] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);

  const trips = ['All', 'Tuggerah Lake', 'Lake Windamere', 'North Entrance Beach'];

  const filteredGear = filter === 'All' 
    ? INITIAL_GEAR 
    : INITIAL_GEAR.filter(item => item.tripSuitability.includes(filter));

  const currentItem = filteredGear[currentIndex] || filteredGear[0];

  const handleNext = () => {
    if (currentIndex < filteredGear.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 font-sans">
      {/* App Header */}
      <header className="w-full max-w-md flex justify-between items-center py-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Anchor className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Tackle Vault
          </h1>
        </div>
        <span className="text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-400 border border-slate-700">
          PROTOTYPE v1.0
        </span>
      </header>

      {/* Trip Selector Filter */}
      <div className="w-full max-w-md mb-6">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-cyan-400" /> Select Trip Context
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {trips.map(trip => (
            <button
              key={trip}
              onClick={() => {
                setFilter(trip);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === trip
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {trip}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card Container */}
      {filteredGear.length > 0 ? (
        <div className="w-full max-w-md flex-1 flex flex-col justify-between">
          <div className={`relative w-full rounded-2xl bg-gradient-to-b ${currentItem.bgGradient} border border-slate-800 p-6 shadow-2xl flex flex-col justify-between min-h-[460px] transition-all`}>
            
            {/* Top Card Badge & Meta */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-slate-950/60 text-cyan-300 border border-cyan-500/30">
                  {currentItem.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentIndex + 1} / {filteredGear.length}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                {currentItem.name}
              </h2>
              <p className="text-xs text-slate-300 font-medium mb-6">
                {currentItem.brand}
              </p>

              {/* Quick Spec Grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Target Depth</span>
                  <span className="text-xs font-bold text-slate-200">{currentItem.depth}</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Line Class</span>
                  <span className="text-xs font-bold text-slate-200">{currentItem.line}</span>
                </div>
              </div>

              {/* Tactical Instructions */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1.5">
                  <Zap className="w-4 h-4" /> Tactical Field Tip
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentItem.tacticalTip}
                </p>
              </div>
            </div>

            {/* Target Species Tag */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-medium">
                <strong className="text-slate-100">Targets:</strong> {currentItem.target}
              </span>
            </div>
          </div>

          {/* Card Navigation Controls */}
          <div className="flex justify-between items-center my-6 gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              ← Previous Item
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === filteredGear.length - 1}
              className="flex-1 py-3 bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 transition"
            >
              Next Item →
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md py-12 text-center text-slate-500 text-sm">
          No gear packed for this specific location yet.
        </div>
      )}
    </div>
  );
}