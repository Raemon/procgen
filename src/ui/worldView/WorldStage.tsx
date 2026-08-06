import { useEffect, useRef } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { classes } from '../controls/classes';
import { mountWorldViews } from './mountWorldViews';
import type { ViewMode } from './viewMode';

export function WorldStage({ mode }: { mode: ViewMode }) {
  const runtime = useAppRuntime();
  const asciiSlot = useRef<HTMLDivElement>(null);
  const view3dSlot = useRef<HTMLDivElement>(null);
  const latestMode = useRef(mode);
  latestMode.current = mode;

  useEffect(
    () =>
      mountWorldViews(
        runtime,
        { ascii: asciiSlot.current!, view3d: view3dSlot.current! },
        () => latestMode.current,
      ),
    [runtime],
  );
  useEffect(() => runtime.renderers.redrawAll(), [mode, runtime]);

  return (
    <div tabIndex={0} className="relative min-h-0 flex-1 outline-none">
      <div ref={asciiSlot} className={classes('absolute inset-0', mode !== 'ascii' && 'hidden')} />
      <div ref={view3dSlot} className={classes('absolute inset-0', mode !== '3d' && 'hidden')} />
    </div>
  );
}
