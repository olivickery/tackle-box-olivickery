import Link from 'next/link';
import { SUPPORT_EMAIL } from '../lib/site';

/** Site footer with legal links. Server-safe; used on the overview, in the app and on legal pages. */
export default function LegalFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`w-full border-t border-slate-900 py-8 px-4 text-center font-mono text-xs text-slate-500 ${className}`}>
      <div className="max-w-5xl mx-auto space-y-3">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400">
          <Link href="/privacy" className="hover:text-slate-200 transition">Privacy Policy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-slate-200 transition">Terms of Service</Link>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-200 transition">Contact</a>
        </nav>
        <p className="text-[11px] text-slate-500 max-w-xl mx-auto leading-relaxed">
          AI suggestions are a guide only. Always check conditions and local fishing rules.
        </p>
        <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} Tacklebox IQ</p>
      </div>
    </footer>
  );
}
