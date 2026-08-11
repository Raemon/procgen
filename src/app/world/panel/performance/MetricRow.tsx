import type { ReactNode } from 'react';

export function MetricRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-ink-dim">{label}</span>
      <span className="font-mono text-ink">{children}</span>
    </div>
  );
}
