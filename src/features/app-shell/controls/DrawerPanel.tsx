import type { ReactNode } from 'react';

export function DrawerPanel({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">{children}</div>;
}
