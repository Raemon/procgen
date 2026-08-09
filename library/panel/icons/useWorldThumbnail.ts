import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { worldThumbnails } from '../../worldThumbnails';
import { useRunningWorld } from '../useRunningWorld';

const LONG_ENOUGH_FOR_THE_VIEW_TO_CATCH_UP_MS = 900;

export function useWorldThumbnail(worldName: string): string | null {
  return useSyncExternalStore(
    (listener) => worldThumbnails.onChange(listener),
    () => worldThumbnails.of(worldName),
  );
}

export function useThumbnailOfTheRunningWorld(): void {
  const running = useRunningWorld();
  const changes = useWorldChangeCount();
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => worldThumbnails.capture(running),
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
