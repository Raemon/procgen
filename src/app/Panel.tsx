import type { ReactNode } from 'react';
import { classes } from '../ui/controls/classes';
import { HintsToggle } from '../ui/help/HintsToggle';
import { CollapseIcon } from '../ui/icons/panelIcons';
import type { TooltipContent } from '../ui/tooltips/tooltipContent';
import { tooltipHandlers } from '../ui/tooltips/tooltipHandlers';
import { useAppRuntime } from './appRuntimeContext';
import { CollapsedRail } from './CollapsedRail';
import { collapsePanelTip } from './help/panelTips';

export interface PanelChrome {
  title: string;
  tip: TooltipContent;
  icon: ReactNode;
  tone: string;
  rail: ReactNode;
  collapsed: boolean;
  onToggleCollapsed(): void;
}

export function Panel({ chrome, children }: { chrome: PanelChrome; children: ReactNode }) {
  const { flushPendingTweaks } = useAppRuntime();
  if (chrome.collapsed) return <CollapsedRail chrome={chrome} />;
  return (
    <div
      className={classes('overflow-y-auto border-r border-panel-edge p-3', chrome.tone)}
      onBlur={flushPendingTweaks}
    >
      <PanelHeader chrome={chrome} />
      {children}
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
      <HintsToggle />
      <button
        type="button"
        aria-label={`collapse ${chrome.title}`}
        className="cursor-pointer rounded border border-transparent p-0.5 text-ink-dim hover:border-panel-edge hover:text-ink"
        onClick={chrome.onToggleCollapsed}
        {...tooltipHandlers(collapsePanelTip(chrome.title))}
      >
        <CollapseIcon />
      </button>
    </div>
  );
}
