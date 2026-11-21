import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tacklebox IQ – Smart gear management',
  description: 'AI-assisted fishing tackle inventory manager and trip planner.',
  applicationName: 'Tacklebox IQ',
  // Home-screen app: an opaque black status bar, so the page starts below it and iOS
  // has nothing to blur behind the clock (the translucent style let content run under it).
  appleWebApp: { capable: true, title: 'Tacklebox IQ', statusBarStyle: 'black' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets env(safe-area-inset-bottom) report the iPhone home-indicator space for the bottom bar.
  viewportFit: 'cover',
  // Safari tints the status-bar strip from this; match the app header so it reads as one dark bar.
  themeColor: '#0f172a',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950 [color-scheme:dark]">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}