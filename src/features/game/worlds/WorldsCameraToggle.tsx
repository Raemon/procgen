import { Button } from '@/features/app-shell/controls/Button';
import { VIEW_MODE_ICONS } from '../panel/viewModeIcons';
import { WORLDS_CAMERA_TIPS } from './help/worldsTips';
import { WORLDS_CAMERAS, type WorldsCamera } from './worldsCamera';

const CAMERA_ICONS = {
  ascii: VIEW_MODE_ICONS['agent-god'],
  '3d-god': VIEW_MODE_ICONS['3d-god'],
} as const;

export function WorldsCameraToggle({
  camera,
  onChoose,
}: {
  camera: WorldsCamera;
  onChoose(next: WorldsCamera): void;
}) {
  return (
    <span className="flex items-center gap-0.5">
      {WORLDS_CAMERAS.map((option) => {
        const CameraIcon = CAMERA_ICONS[option];
        return (
          <Button
            key={option}
            className="px-1 py-0.5"
            active={camera === option}
            tip={WORLDS_CAMERA_TIPS[option]}
            onClick={() => onChoose(option)}
          >
            <CameraIcon size={12} />
          </Button>
        );
      })}
    </span>
  );
}
