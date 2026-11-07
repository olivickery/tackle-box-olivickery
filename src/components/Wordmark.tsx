import React from 'react';

/** Brand wordmark: "Tacklebox" in white, "IQ" in the amber accent. */
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight whitespace-nowrap ${className}`}>
      <span className="text-slate-100">Tacklebox</span>{' '}
      <span className="text-amber-500">IQ</span>
    </span>
  );
}
