export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <header className="border-b border-slate-800 pb-6 mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">{title}</h1>
      <p className="text-xs font-mono text-slate-500 mt-2">Last updated {updated}</p>
    </header>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 space-y-3 text-sm leading-relaxed text-slate-300">
      <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: [string, string][] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 text-slate-400">
      {items.map(([label, body]) => (
        <li key={label}>
          <strong className="text-slate-200">{label}:</strong> {body}
        </li>
      ))}
    </ul>
  );
}
