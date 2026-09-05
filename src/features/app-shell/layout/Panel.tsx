import type { ReactNode } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { HintsToggle } from '../help/HintsToggle';
import { CollapseButton } from './CollapseButton';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { CollapsedRail } from './CollapsedRail';

export interface PanelChrome {
  title: string;
  tip: TooltipContent;
  icon: ReactNode;
  tone: string;
  rail: ReactNode;
  expandTip?: TooltipContent;
  headerActions?: ReactNode;
  collapsed: boolean;
  fill?: boolean;
  onToggleCollapsed(): void;
}

export function Panel({ chrome, children }: { chrome: PanelChrome; children: ReactNode }) {
  const { flushPendingTweaks } = useAppRuntime();
  if (chrome.collapsed) return <CollapsedRail chrome={chrome} />;
  return (
    <div
      className={classes(
        'border-r border-panel-edge p-3',
        chrome.tone,
        chrome.fill ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'overflow-y-auto',
      )}
      onBlur={flushPendingTweaks}
    >
      <PanelHeader chrome={chrome} />
      {chrome.fill ? <div className="min-h-0 flex-1 overflow-hidden">{children}</div> : children}
    </div>
  );
}

function PanelHeader({ chrome }: { chrome: PanelChrome }) {
  return (
    <div
      className={classes(
        'sticky top-0 z-10 -mx-3 -mt-3 mb-2.5 flex items-center gap-1.5 px-3 pt-3 pb-2',
        chrome.tone,
      )}
    >
      <span className="flex items-center gap-1.5 text-ink-dim" {...tooltipHandlers(chrome.tip)}>
        {chrome.icon}
        <h2 className="text-[13px] tracking-[0.12em] uppercase">{chrome.title}</h2>
      </span>
      <span className="flex-1" />
      {chrome.headerActions}
      <HintsToggle />
      <CollapseButton title={chrome.title} onCollapse={chrome.onToggleCollapsed} />
    </div>
  );
}
