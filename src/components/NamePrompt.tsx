'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanName, profileFields } from '../lib/profile';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60';

/**
 * Asks an existing account (created before names were collected) for its name.
 * Saves to the auth user's metadata; the session refreshes automatically.
 */
export default function NamePrompt({
  reason, onDone, onSkip,
}: {
  reason: 'welcome' | 'share';
  onDone: (firstName: string) => void;
  onSkip: () => void;
}) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName(first)) return;
    setSaving(true);
    setError(null);
    const fields = profileFields(first, last, optIn);
    const { error } = await supabase.auth.updateUser({ data: fields });
    setSaving(false);
    if (error) {
      setError("Couldn't save just now. Please try again.");
      return;
    }
    onDone(fields.first_name);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="name-prompt-title">
      <div className="min-h-full flex items-center justify-center p-4 pb-12">
        <form onSubmit={save} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3">
          <h2 id="name-prompt-title" className="text-lg font-bold text-slate-100">
            {reason === 'share' ? 'Add your name to share' : 'What should we call you?'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {reason === 'share'
              ? 'Shared lists show your first name, like “Oli’s restock list”, so people know who sent it.'
              : 'Add your name to your account. Your first name appears on lists you share.'}
          </p>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <input type="text" required autoFocus autoComplete="given-name" placeholder="First name" aria-label="First name"
              maxLength={40} value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} />
            <input type="text" autoComplete="family-name" placeholder="Last name" aria-label="Last name (optional)"
              maxLength={40} value={last} onChange={(e) => setLast(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed cursor-pointer select-none">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 accent-amber-500" />
            <span>Email me fishing tips and Tacklebox IQ news. Optional, unsubscribe any time.</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onSkip} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition">
              {reason === 'share' ? 'Cancel' : 'Not now'}
            </button>
            <button type="submit" disabled={saving || !cleanName(first)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {reason === 'share' ? 'SAVE AND SHARE' : 'SAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
