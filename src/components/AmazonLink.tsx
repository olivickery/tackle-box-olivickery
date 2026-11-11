import { ExternalLink } from 'lucide-react';
import { amazonSearchUrl, AMAZON_DISCLOSURE } from '../lib/affiliate';

/** "Find on Amazon" affiliate link (opens amazon.com.au search in a new tab). */
export function AmazonLink({
  brand, name, compact = false, className = '',
}: { brand?: string; name: string; compact?: boolean; className?: string }) {
  return (
    <a
      href={amazonSearchUrl({ brand, name })}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Find ${[brand, name].filter(Boolean).join(' ')} on Amazon (opens in a new tab)`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-500/40 text-amber-400 font-mono transition shrink-0 ${
        compact ? 'text-[10px] font-bold px-2 py-1' : 'text-xs px-3 py-1.5'
      } ${className}`}
    >
      {compact ? 'Amazon' : 'Find on Amazon'}
      <ExternalLink className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </a>
  );
}

/** Small-print Amazon Associates disclosure, shown wherever affiliate links appear. */
export function AmazonDisclosure({ className = '' }: { className?: string }) {
  return <p className={`text-[10px] font-mono text-slate-500 leading-normal ${className}`}>{AMAZON_DISCLOSURE}</p>;
}
