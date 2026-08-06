import { useEffect, useRef } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { ChatComposer } from '../chat/ChatComposer';
import { classes } from '../controls/classes';
import { mountWorldViews, type MountedWorldViews } from './mountWorldViews';
import { usesView3d, type ViewMode } from './viewMode';

export function WorldStage({ mode }: { mode: ViewMode }) {
  const runtime = useAppRuntime();
  const view3dSlot = useRef<HTMLDivElement>(null);
  const agentGodSlot = useRef<HTMLDivElement>(null);
  const agentCharacterSlot = useRef<HTMLDivElement>(null);
  const mounted = useRef<MountedWorldViews | null>(null);
  const latestMode = useRef(mode);
  latestMode.current = mode;

  useEffect(() => {
    mounted.current = mountWorldViews(
      runtime,
      {
        view3d: view3dSlot.current!,
        agentGod: agentGodSlot.current!,
        agentCharacter: agentCharacterSlot.current!,
      },
      () => latestMode.current,
    );
    mounted.current.onModeChanged(latestMode.current);
    return () => mounted.current?.dispose();
  }, [runtime]);

  useEffect(() => {
    mounted.current?.onModeChanged(mode);
    runtime.renderers.redrawAll();
  }, [mode, runtime]);

  return (
    <div tabIndex={0} className="relative min-h-0 flex-1 outline-none">
      <div ref={view3dSlot} className={classes('absolute inset-0', !usesView3d(mode) && 'hidden')} />
      <div
        ref={agentGodSlot}
        className={classes('absolute inset-0', mode !== 'agent-god' && 'hidden')}
      />
      <div
        ref={agentCharacterSlot}
        className={classes('absolute inset-0', mode !== 'agent-character' && 'hidden')}
      />
      <ChatComposer />
    </div>
  );
}
