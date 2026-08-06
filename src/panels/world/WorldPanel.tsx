import { useState } from 'react';
import { WorldStage } from './stage/WorldStage';
import { ViewModeToolbar } from './toolbar/ViewModeToolbar';
import type { ViewMode } from './viewMode';

export function WorldPanel() {
  const [mode, setMode] = useState<ViewMode>('ascii');
  return (
    <div className="flex min-w-0 flex-col">
      <ViewModeToolbar mode={mode} onPick={setMode} />
      <WorldStage mode={mode} />
    </div>
  );
}
