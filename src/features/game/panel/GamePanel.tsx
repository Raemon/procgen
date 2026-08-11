import { useState } from 'react';
import { Button } from '@/features/app-shell/controls/Button';
import { WorldIcon } from '@/features/app-shell/icons/panelIcons';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { GAME_VIEW_TIP, VIEW_MODE_TIPS } from './help/gameTips';
import { RunningWorldName } from './RunningWorldName';
import { GameStage } from './GameStage';
import { GameToolbar } from './GameToolbar';
import { VIEW_MODES, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

export function GamePanel() {
  const [mode, setMode] = useState<ViewMode>(lastUsedViewMode);
  const chooseMode = (next: ViewMode): void => {
    rememberViewMode(next);
    setMode(next);
  };
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="text-ink-dim" {...tooltipHandlers(GAME_VIEW_TIP)}>
          <WorldIcon />
        </span>
        {VIEW_MODES.map((entry) => (
          <Button
            key={entry.id}
            active={mode === entry.id}
            tip={VIEW_MODE_TIPS[entry.id]}
            onClick={() => chooseMode(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
        <GameToolbar mode={mode} />
        <RunningWorldName />
      </div>
      <GameStage mode={mode} />
    </div>
  );
}
