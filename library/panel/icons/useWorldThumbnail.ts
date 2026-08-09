import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { CURRENT_WORLD } from '../../librarySelection';
import { worldThumbnails } from '../../worldThumbnails';

const LONG_ENOUGH_FOR_THE_VIEW_TO_CATCH_UP_MS = 900;

export function useWorldThumbnail(worldKey: string): string | null {
  return useSyncExternalStore(
    (listener) => worldThumbnails.onChange(listener),
    () => worldThumbnails.of(worldKey),
  );
}

export function useThumbnailOfTheWorldBeingEdited(): void {
  const changes = useWorldChangeCount();
  useEffect(() => {
    const timer = setTimeout(
      () => worldThumbnails.capture(CURRENT_WORLD),
      LONG_ENOUGH_FOR_THE_VIEW_TO_CATCH_UP_MS,
    );
    return () => clearTimeout(timer);
  }, [changes]);
}

function useWorldChangeCount(): number {
  const { subscribeToWorldChange } = useAppRuntime();
  const [changes, countOneMore] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribeToWorldChange(countOneMore), [subscribeToWorldChange]);
  return changes;
}
