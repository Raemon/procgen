import type { ReactNode } from 'react';
import { classes } from '../ui/controls/classes';
import { HintsToggle } from '../ui/help/HintsToggle';
import { CollapseIcon } from '../ui/icons/panelIcons';
import { useAppRuntime } from './appRuntimeContext';

export interface PanelChrome {
  title: string;
  icon: ReactNode;
  tone: string;
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
      <span className="text-ink-dim">{chrome.icon}</span>
      <h2 className="flex-1 text-[13px] tracking-[0.12em] text-ink-dim uppercase">{chrome.title}</h2>
      <HintsToggle />
      <button
        type="button"
        className="cursor-pointer rounded border border-transparent p-0.5 text-ink-dim hover:border-panel-edge hover:text-ink"
        title={`collapse ${chrome.title}`}
        onClick={chrome.onToggleCollapsed}
      >
        <CollapseIcon />
      </button>
    </div>
  );
}

function CollapsedRail({ chrome }: { chrome: PanelChrome }) {
  return (
    <button
      type="button"
      title={`expand ${chrome.title}`}
      onClick={chrome.onToggleCollapsed}
      className={classes(
        'flex cursor-pointer flex-col items-center gap-2 overflow-hidden border-r border-panel-edge py-2.5 text-ink-dim hover:text-ink',
        chrome.tone,
      )}
    >
      {chrome.icon}
      <span className="text-[11px] tracking-[0.12em] uppercase [writing-mode:vertical-rl]">
        {chrome.title}
      </span>
    </button>
  );
}
