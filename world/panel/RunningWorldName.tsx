import { classes } from '../../frontend/controls/classes';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { useLibrarySelection } from '../../library/panel/useLibrarySelection';
import { useRunningWorld } from '../../library/panel/useRunningWorld';
import { runningWorldTip } from './help/worldTips';

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
