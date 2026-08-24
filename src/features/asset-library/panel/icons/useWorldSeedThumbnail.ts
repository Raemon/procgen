import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { worldSeedThumbnails } from '../../worldSeedThumbnails';
import { useRunningWorldSeed } from '../useRunningWorld';

const LONG_ENOUGH_FOR_THE_VIEW_TO_CATCH_UP_MS = 900;

export function useWorldSeedThumbnail(worldName: string): string | null {
  return useSyncExternalStore(
    (listener) => worldSeedThumbnails.onChange(listener),
    () => worldSeedThumbnails.of(worldName),
  );
}

export function useThumbnailOfTheRunningWorld(): void {
  const running = useRunningWorldSeed();
  const changes = useWorldChangeCount();
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => worldSeedThumbnails.capture(running),
      LONG_ENOUGH_FOR_THE_VIEW_TO_CATCH_UP_MS,
    );
    return () => clearTimeout(timer);
  }, [changes, running]);
}

function useWorldChangeCount(): number {
  const { subscribeToWorldChange } = useAppRuntime();
  const [changes, countOneMore] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribeToWorldChange(countOneMore), [subscribeToWorldChange]);
  return changes;
}
