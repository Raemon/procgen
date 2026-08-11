import { useCallback, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { AppRuntime } from '@/features/app-shell/runtime/appRuntime';
import {
  actionWithinReach,
  interactPrompt,
} from '../puzzles/interaction/actionWithinReach';

export function InteractPrompt() {
  const runtime = useAppRuntime();
  const prompt = useSyncExternalStore(
    useCallback((onChange) => subscribeToWhatIsWithinReach(runtime, onChange), [runtime]),
    useCallback(() => promptForWhatIsWithinReach(runtime), [runtime]),
  );
  if (!prompt) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
      <span className="rounded bg-black/70 px-3 py-1 font-mono text-[12px] text-ink">{prompt}</span>
    </div>
  );
}

function promptForWhatIsWithinReach(runtime: AppRuntime): string | null {
  const { world } = runtime;
  return interactPrompt(
    actionWithinReach(runtime.puzzles, {
      x: world.playerX,
      y: world.playerY,
      facing: world.facing,
    }),
  );
}

function subscribeToWhatIsWithinReach(runtime: AppRuntime, onChange: () => void): () => void {
  return runtime.renderers.add({ redraw: onChange, recenterOnPlayer: onChange });
}
