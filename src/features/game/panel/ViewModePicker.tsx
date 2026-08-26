import { Button } from '@/features/app-shell/controls/Button';
import { VIEW_MODE_TIPS } from './help/gameTips';
import { VIEW_MODES, type ViewMode } from './viewMode';
import { VIEW_MODE_ICONS } from './viewModeIcons';

export function ViewModePicker({
  mode,
  onChoose,
}: {
  mode: ViewMode;
  onChoose(next: ViewMode): void;
}) {
  return (
    <div className="flex items-center gap-1">
      {VIEW_MODES.map((option) => {
        const ModeIcon = VIEW_MODE_ICONS[option];
        return (
          <Button
            key={option}
            className="px-1.5 py-1.5"
            active={mode === option}
            tip={VIEW_MODE_TIPS[option]}
            onClick={() => onChoose(option)}
          >
            <ModeIcon size={16} />
          </Button>
        );
      })}
    </div>
  );
}
