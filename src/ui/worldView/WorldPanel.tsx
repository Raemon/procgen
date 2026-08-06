import { useState } from 'react';
import { Button } from '../controls/Button';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { WorldStage } from './WorldStage';
import { WorldToolbar } from './WorldToolbar';
import { MODE_HINTS, VIEW_MODES, type ViewMode } from './viewMode';

export function WorldPanel() {
  const [mode, setMode] = useState<ViewMode>('3d-god');
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-panel-edge bg-panel px-3 py-2">
        {VIEW_MODES.map((entry) => (
          <Button key={entry.id} active={mode === entry.id} onClick={() => setMode(entry.id)}>
            {entry.label}
          </Button>
        ))}
        <WorldToolbar />
        <p className={`${HINT_CLASSES} ml-auto`}>{MODE_HINTS[mode]}</p>
      </div>
      <WorldStage mode={mode} />
    </div>
  );
}
