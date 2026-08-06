import { useState } from 'react';
import { Button } from '../controls/Button';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { WorldIcon } from '../icons/panelIcons';
import { WorldStage } from './WorldStage';
import { WorldToolbar } from './WorldToolbar';
import { MODE_HINTS, VIEW_MODES, type ViewMode } from './viewMode';
import { lastUsedViewMode, rememberViewMode } from './viewModePreference';

export function WorldPanel() {
  const [mode, setMode] = useState<ViewMode>(lastUsedViewMode);
  const chooseMode = (next: ViewMode): void => {
    rememberViewMode(next);
    setMode(next);
  };
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-panel-edge bg-panel px-3 py-2">
        <span className="text-ink-dim" title="world">
          <WorldIcon />
        </span>
        {VIEW_MODES.map((entry) => (
          <Button key={entry.id} active={mode === entry.id} onClick={() => chooseMode(entry.id)}>
            {entry.label}
          </Button>
        ))}
        <WorldToolbar />
        <p className={`${HINT_CLASSES} ml-auto`}>{MODE_HINTS[mode]} · return opens chat</p>
      </div>
      <WorldStage mode={mode} />
    </div>
  );
}
