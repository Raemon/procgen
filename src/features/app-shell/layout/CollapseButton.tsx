import { CollapseIcon } from '@/features/app-shell/icons/panelIcons';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { collapsePanelTip } from '../help/panelTips';

export function CollapseButton({ title, onCollapse }: { title: string; onCollapse(): void }) {
  return (
    <button
      type="button"
      aria-label={`collapse ${title}`}
      className="cursor-pointer rounded border border-transparent p-0.5 text-ink-dim hover:border-panel-edge hover:text-ink"
      onClick={onCollapse}
      {...tooltipHandlers(collapsePanelTip(title))}
    >
      <CollapseIcon />
    </button>
  );
}
