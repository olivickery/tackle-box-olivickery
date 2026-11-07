import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tacklebox IQ – Track & Manage Your Fishing Gear',
  description: 'AI-assisted fishing tackle inventory manager and trip planner.',
  applicationName: 'Tacklebox IQ',
  appleWebApp: { title: 'Tacklebox IQ', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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