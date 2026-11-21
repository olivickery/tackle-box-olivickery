import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tacklebox IQ – Smart gear management',
  description: 'AI-assisted fishing tackle inventory manager and trip planner.',
  applicationName: 'Tacklebox IQ',
  appleWebApp: { title: 'Tacklebox IQ', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets env(safe-area-inset-bottom) report the iPhone home-indicator space for the bottom bar.
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}