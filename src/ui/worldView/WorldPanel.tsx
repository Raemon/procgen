import { useState } from 'react';
import { Button } from '../controls/Button';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { WorldStage } from './WorldStage';
import type { ViewMode } from './viewMode';

export function WorldPanel() {
  const [mode, setMode] = useState<ViewMode>('ascii');
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-1.5 border-b border-panel-edge bg-panel px-3 py-2">
        <Button active={mode === 'ascii'} onClick={() => setMode('ascii')}>
          ASCII
        </Button>
        <Button active={mode === '3d'} onClick={() => setMode('3d')}>
          2.5D
        </Button>
        <p className={`${HINT_CLASSES} ml-auto`}>
          WASD/arrows move (recenters the camera) · Q/E rotate camera · wheel zoom · drag to pan ·
          double-click to recenter
        </p>
      </div>
      <WorldStage mode={mode} />
    </div>
  );
}
