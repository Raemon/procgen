import { Button } from '../../../ui/controls/Button';
import { HINT_CLASSES } from '../../../ui/controls/fieldClasses';
import type { ViewMode } from '../viewMode';

export function ViewModeToolbar({
  mode,
  onPick,
}: {
  mode: ViewMode;
  onPick: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 border-b border-panel-edge bg-panel px-3 py-2">
      <Button active={mode === 'ascii'} onClick={() => onPick('ascii')}>
        ASCII
      </Button>
      <Button active={mode === '3d'} onClick={() => onPick('3d')}>
        2.5D
      </Button>
      <p className={`${HINT_CLASSES} ml-auto`}>
        WASD/arrows move (recenters the camera) · Q/E rotate camera · wheel zoom · drag to pan ·
        double-click to recenter
      </p>
    </div>
  );
}
