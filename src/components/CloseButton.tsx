'use client';

import React from 'react';
import { X } from 'lucide-react';

/** The one close control for every sheet and modal: an ✕ in a circle (44px tap area). */
const CloseButton = React.forwardRef<HTMLButtonElement, {
  onClick: () => void;
  label?: string;
  className?: string;
}>(function CloseButton({ onClick, label = 'Close', className = '' }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition before:absolute before:-inset-1 before:content-[''] ${className}`}
    >
      <X className="w-5 h-5" />
    </button>
  );
});

export default CloseButton;
