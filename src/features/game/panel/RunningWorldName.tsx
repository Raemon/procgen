import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import { useRunningWorld } from '@/features/asset-library/panel/useRunningWorld';
import { runningWorldTip } from './help/gameTips';

export function RunningWorldName() {
  const running = useRunningWorld();
  const { select } = useLibrarySelection();
  return (
    <button
      type="button"
      className={classes(
        'min-w-0 cursor-pointer truncate rounded border border-transparent px-1.5 py-0.5 text-xs',
        running ? 'text-ink' : 'text-ink-dim italic',
        'hover:border-panel-edge hover:bg-field',
      )}
      onClick={() => running && select('worlds', running)}
      {...tooltipHandlers(runningWorldTip(running))}
    >
      {running || 'no world running'}
    </button>
  );
}
