import { Button } from '@/features/app-shell/controls/Button';
import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { CollapseButton } from '@/features/app-shell/layout/CollapseButton';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { GAME_VIEW_TIP, RANDOMIZE_WORLD_TIP, REROLL_SEED_TIP, SAVE_WORLD_TIP } from './help/gameTips';
import { GameToolbar } from './GameToolbar';
import { RunningWorldName } from './RunningWorldName';
import { ViewModePicker } from './ViewModePicker';
import type { ViewMode } from './viewMode';

export function GameHeader({
  title,
  mode,
  onChooseMode,
  onCollapse,
}: {
  title: string;
  mode: ViewMode;
  onChooseMode(next: ViewMode): void;
  onCollapse(): void;
}) {
  const { perform } = useAppRuntime();
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
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
        <ViewModePicker mode={mode} onChoose={onChooseMode} />
        <GameToolbar mode={mode} />
      </div>
      <CollapseButton title={title} onCollapse={onCollapse} />
    </div>
  );
}
