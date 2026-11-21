'use client';

import React from 'react';
import CloseButton from './CloseButton';

/**
 * The one header for every app section (Plan, Pack lists, Restock, checklists):
 * amber icon + title, optional subtitle, circled close button top right.
 */
export default function SectionHeader({
  icon,
  title,
  subtitle,
  onClose,
  closeLabel = 'Back to my gear',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
  /** Optional extra controls under the title row. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-sans flex items-center gap-2">
            <span className="shrink-0 text-amber-400 [&>svg]:w-6 [&>svg]:h-6">{icon}</span>
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && <p className="text-xs text-slate-400 font-mono mt-1">{subtitle}</p>}
        </div>
        <CloseButton onClick={onClose} label={closeLabel} />
      </div>
      {children}
    </div>
  );
}
