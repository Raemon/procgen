import { useEffect } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  useRerenderOnCaptureChange,
  useRerenderOnCreatureClockChange,
} from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { CAPTURE_TIP, LIFE_TIP } from './help/worldTips';

export function WorldToolbar() {
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
