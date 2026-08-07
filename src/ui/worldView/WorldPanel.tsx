import { useState } from 'react';
import { Button } from '../controls/Button';
import { WorldIcon } from '../icons/panelIcons';
import { WorldStage } from './WorldStage';
import { WorldToolbar } from './WorldToolbar';
import { VIEW_MODES, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

export function WorldPanel() {
  const [mode, setMode] = useState<ViewMode>(lastUsedViewMode);
  const chooseMode = (next: ViewMode): void => {
    rememberViewMode(next);
    setMode(next);
  };
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="text-ink-dim" title="world">
          <WorldIcon />
        </span>
        {VIEW_MODES.map((entry) => (
          <Button key={entry.id} active={mode === entry.id} onClick={() => chooseMode(entry.id)}>
            {entry.label}
          </Button>
        ))}
        <WorldToolbar />
      </div>
      <WorldStage mode={mode} />
    </div>
  );
}
