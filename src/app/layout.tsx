import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'procgen — procedural world playground',
  description: 'Build, inspect, and explore procedurally generated worlds.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-bg font-mono text-ink">{children}</body>
    </html>
  );
}
