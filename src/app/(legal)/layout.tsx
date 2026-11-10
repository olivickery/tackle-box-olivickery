import Link from 'next/link';
import Wordmark from '../../components/Wordmark';
import LegalFooter from '../../components/LegalFooter';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-amber-500/20 selection:text-amber-300">
      <header className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="text-base leading-none hover:opacity-80 transition">
            <Wordmark />
          </Link>
          <Link href="/" className="text-xs font-mono text-amber-400 hover:text-amber-300 transition whitespace-nowrap">
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">{children}</main>
      <LegalFooter />
    </div>
  );
}
