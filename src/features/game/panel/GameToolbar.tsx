import { useEffect } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import {
  useRerenderOnCaptureChange,
  useRerenderOnCreatureClockChange,
} from '@/features/app-shell/runtime/rerenderHooks';
import { Button } from '@/features/app-shell/controls/Button';
import { SightRangeControl } from './SightRangeControl';
import { CAPTURE_TIP, LIFE_TIP } from './help/gameTips';
import { isCharacterControlled, type ViewMode } from './viewMode';

export function GameToolbar({ mode }: { mode: ViewMode }) {
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
      {isCharacterControlled(mode) ? <SightRangeControl /> : null}
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
