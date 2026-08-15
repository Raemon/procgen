import { useEffect, useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import {
  useRerenderOnCaptureChange,
  useRerenderOnCreatureClockChange,
} from '@/features/app-shell/runtime/rerenderHooks';
import { Button } from '@/features/app-shell/controls/Button';
import { asciiColorOn, setAsciiColorOn } from '../render/agentText/asciiColorPreference';
import { SightRangeControl } from './SightRangeControl';
import { ASCII_COLOR_TIP, CAPTURE_TIP, LIFE_TIP } from './help/gameTips';
import { isCharacterControlled, usesAgentText, type ViewMode } from './viewMode';

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
      {usesAgentText(mode) ? <AsciiColorToggle /> : null}
    </>
  );
}

function AsciiColorToggle() {
  const [colorOn, setColorOn] = useState(asciiColorOn);
  const toggle = (): void => {
    setAsciiColorOn(!colorOn);
    setColorOn(!colorOn);
  };
  return (
    <Button active={colorOn} onClick={toggle} tip={ASCII_COLOR_TIP}>
      color
    </Button>
  );
}

function cancelCaptureOnEscape(cancel: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') cancel();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
