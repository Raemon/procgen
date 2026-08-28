import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';

export function useRunningWorldSeed(): string {
  const { runningWorld } = useAppRuntime();
  return useSyncExternalStore(
    (listener) => runningWorld.onChange(listener),
    () => runningWorld.seedName(),
  );
}

export function useRunningSavedWorld(): string {
  const { runningWorld } = useAppRuntime();
  return useSyncExternalStore(
    (listener) => runningWorld.onChange(listener),
    () => runningWorld.savedWorldName(),
  );
}

export function useRunningWorldName(): string {
  const { runningWorld } = useAppRuntime();
  return useSyncExternalStore(
    (listener) => runningWorld.onChange(listener),
    () => runningWorld.name(),
  );
}
