import { useEffect, useState } from 'react';
import { Button } from '@/features/app-shell/controls/Button';
import { classes } from '@/features/app-shell/controls/classes';
import { Select } from '@/features/app-shell/controls/Select';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { GAME_VIEW_TIP, RANDOMIZE_WORLD_TIP, REROLL_SEED_TIP, VIEW_MODE_TIPS } from './help/gameTips';
import { RunningWorldName } from './RunningWorldName';
import { GameStage } from './GameStage';
import { GameToolbar } from './GameToolbar';
import { isFullscreenView, isGodView, isViewMode, VIEW_MODES, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

export function GamePanel() {
  const { cameraFocus, perform } = useAppRuntime();
  const [mode, setMode] = useState<ViewMode>(lastUsedViewMode);
  const chooseMode = (next: ViewMode): void => {
    rememberViewMode(next);
    setMode(next);
  };
  useEffect(
    () =>
      cameraFocus.subscribe(() => {
        if (cameraFocus.followedId() !== null) setMode((shown) => (isGodView(shown) ? shown : '3d-god'));
      }),
    [cameraFocus],
  );
  return (
    <div
      className={classes(
        'flex min-w-0 flex-col',
        isFullscreenView(mode) && 'fixed inset-0 z-40 bg-bg',
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="text-ink-dim" {...tooltipHandlers(GAME_VIEW_TIP)}>
          <WorldIcon />
        </span>
        <RunningWorldName />
        <Button
          className="whitespace-nowrap"
          tip={REROLL_SEED_TIP}
          onClick={() => perform('randomize_seed')}
        >
          🎲 reroll
        </Button>
        <Button
          className="whitespace-nowrap"
          tip={RANDOMIZE_WORLD_TIP}
          onClick={() => perform('randomize_world')}
        >
          ✨ new world
        </Button>
        <Select
          options={VIEW_MODES.map((entry) => ({ value: entry.id, text: entry.label }))}
          value={mode}
          onChange={(value) => isViewMode(value) && chooseMode(value)}
          tip={VIEW_MODE_TIPS[mode]}
          fullWidth={false}
        />
        <GameToolbar mode={mode} />
      </div>
      <GameStage mode={mode} />
    </div>
  );
}
