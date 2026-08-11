import type { ReactNode } from 'react';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export function PerformanceSection({
  tip,
  children,
}: {
  tip: TooltipContent;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h3
        className="cursor-help text-[10px] tracking-wide text-ink-dim uppercase"
        {...tooltipHandlers(tip)}
      >
        {tip.title}
      </h3>
      {children}
    </section>
  );
}
