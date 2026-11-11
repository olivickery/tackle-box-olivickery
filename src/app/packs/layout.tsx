import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My pack lists | Tacklebox IQ',
};

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
