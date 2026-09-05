import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { expandPanelTip } from '../help/panelTips';
import type { PanelChrome } from './Panel';
import { COLLAPSED_PANEL_WIDTH } from './usePanelLayout';

export function CollapsedRail({ chrome }: { chrome: PanelChrome }) {
  return (
    <div
      className={classes(
        'flex cursor-pointer overflow-hidden border-r border-panel-edge',
        chrome.tone,
      )}
      onClick={chrome.onToggleCollapsed}
    >
      <div
        className="flex shrink-0 flex-col items-center gap-1.5 py-2.5 text-ink-dim hover:text-ink"
        style={{ width: COLLAPSED_PANEL_WIDTH }}
      >
        <button
          type="button"
          aria-label={`expand ${chrome.title}`}
          onClick={chrome.onToggleCollapsed}
          className="flex shrink-0 cursor-pointer flex-col items-center gap-2"
          {...tooltipHandlers(chrome.expandTip ?? expandPanelTip(chrome.title))}
        >
          {chrome.icon}
          <span className="text-[11px] tracking-[0.12em] uppercase [writing-mode:vertical-rl]">
            {chrome.title}
          </span>
        </button>
        {chrome.rail}
      </div>
    </div>
  );
}
