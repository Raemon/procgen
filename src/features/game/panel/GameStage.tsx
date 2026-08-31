import { useEffect, useRef } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { ChatComposer } from '../chat/ui/ChatComposer';
import { classes } from '@/features/app-shell/controls/classes';
import { CharacterLegend } from './CharacterLegend';
import { mountWorldViews, type MountedWorldViews } from './mountWorldViews';
import { InteractPrompt } from './InteractPrompt';
import { FpsBadge } from './performance/FpsBadge';
import { PickupNotices } from './PickupNotices';
import { PlayerInventoryOverlay } from './PlayerInventoryOverlay';
import { TileHoverDetails } from './TileHoverDetails';
import { usesView3d, type ViewMode } from './viewMode';

export function GameStage({ mode }: { mode: ViewMode }) {
  const runtime = useAppRuntime();
  const view3dSlot = useRef<HTMLDivElement>(null);
  const agentGodSlot = useRef<HTMLDivElement>(null);
  const agentGodSidebarSlot = useRef<HTMLDivElement>(null);
  const agentCharacterSlot = useRef<HTMLDivElement>(null);
  const featuresSlot = useRef<HTMLDivElement>(null);
  const mounted = useRef<MountedWorldViews | null>(null);
  const latestMode = useRef(mode);
  latestMode.current = mode;

  useEffect(() => {
    mounted.current = mountWorldViews(
      runtime,
      {
        view3d: view3dSlot.current!,
        agentGod: agentGodSlot.current!,
        agentGodSidebar: agentGodSidebarSlot.current!,
        agentCharacter: agentCharacterSlot.current!,
        features: featuresSlot.current!,
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
      <div className={classes('absolute inset-0 flex', mode !== 'agent-god' && 'hidden')}>
        <div className="flex w-64 shrink-0 flex-col gap-3 overflow-auto p-3">
          <CharacterLegend placement="column" />
          <div ref={agentGodSidebarSlot} className="min-w-0" />
        </div>
        <div ref={agentGodSlot} className="relative min-w-0 flex-1" />
      </div>
      <div
        ref={agentCharacterSlot}
        className={classes('absolute inset-0', mode !== 'agent-character' && 'hidden')}
      />
      <div
        ref={featuresSlot}
        className={classes('absolute inset-0', mode !== 'features' && 'hidden')}
      />
      {usesView3d(mode) && <InteractPrompt />}
      {mode === '3d-god' && <CharacterLegend placement="overlay" />}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col items-start gap-1">
        <PickupNotices />
        <TileHoverDetails />
      </div>
      <PlayerInventoryOverlay />
      <ChatComposer />
      <FpsBadge />
    </div>
  );
}
