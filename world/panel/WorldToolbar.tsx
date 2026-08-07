import { useEffect } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import {
  useRerenderOnCaptureChange,
  useRerenderOnCreatureClockChange,
} from '../../frontend/rerenderHooks';
import { Button } from '../../frontend/controls/Button';
import { SightRangeControl } from './SightRangeControl';
import { CAPTURE_TIP, LIFE_TIP } from './help/worldTips';
import { isCharacterControlled, type ViewMode } from './viewMode';

export function WorldToolbar({ mode }: { mode: ViewMode }) {
  const { capture, clock } = useAppRuntime();
  useRerenderOnCaptureChange();
  useRerenderOnCreatureClockChange();
  useEffect(() => cancelCaptureOnEscape(() => capture.setActive(false)), [capture]);
  return (
    <>
      <Button
        active={capture.isActive()}
        onClick={() => capture.setActive(!capture.isActive())}
        tip={CAPTURE_TIP}
      >
        capture
      </Button>
      <Button
        active={clock.isRunning()}
        onClick={() => clock.setRunning(!clock.isRunning())}
        tip={LIFE_TIP}
      >
        life
      </Button>
      {isCharacterControlled(mode) && <SightRangeControl />}
    </>
  );
}

function cancelCaptureOnEscape(cancel: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') cancel();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
