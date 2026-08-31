import { useEffect, useState } from 'react';
import { Button } from '@/features/app-shell/controls/Button';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { CollapseIcon, WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import {
  COLLAPSE_WORLD_VIEW_TIP,
  GAME_VIEW_TIP,
  RANDOMIZE_WORLD_TIP,
  REROLL_SEED_TIP,
  SAVE_WORLD_TIP,
} from './help/gameTips';
import { RunningWorldName } from './RunningWorldName';
import { GameStage } from './GameStage';
import { GameToolbar } from './GameToolbar';
import { ViewModePicker } from './ViewModePicker';
import { isGodView, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

export function GamePanel({ onCollapse }: { onCollapse(): void }) {
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
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <CollapseWorldViewButton onCollapse={onCollapse} />
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
          onClick={() => perform('randomize_world_seed')}
        >
          ✨ new world
        </Button>
        <Button
          className="whitespace-nowrap"
          tip={SAVE_WORLD_TIP}
          onClick={() => perform('save_world')}
        >
          💾 save
        </Button>
        <ViewModePicker mode={mode} onChoose={chooseMode} />
        <GameToolbar mode={mode} />
      </div>
      <GameStage mode={mode} />
    </div>
  );
}

function CollapseWorldViewButton({ onCollapse }: { onCollapse(): void }) {
  return (
    <button
      type="button"
      aria-label="collapse world view"
      className="shrink-0 cursor-pointer rounded border border-transparent p-0.5 text-ink-dim hover:border-panel-edge hover:text-ink"
      onClick={onCollapse}
      {...tooltipHandlers(COLLAPSE_WORLD_VIEW_TIP)}
    >
      <CollapseIcon />
    </button>
  );
}
