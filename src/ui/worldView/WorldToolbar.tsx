import { useEffect } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  useRerenderOnCaptureChange,
  useRerenderOnCreatureClockChange,
} from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';

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
        {...tooltipHandlers({
          title: 'capture',
          body: 'Drag a rectangle over the world to lift that section — tiles, stacked prefab voxels and terrain height — into a new prefab in the library. Esc leaves capture mode.',
        })}
      >
        capture
      </Button>
      <Button
        active={clock.isRunning()}
        onClick={() => clock.setRunning(!clock.isRunning())}
        {...tooltipHandlers({
          title: 'life',
          body: 'Runs the creature simulation. Paused, creatures hold their positions; the world itself is unaffected either way.',
        })}
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
