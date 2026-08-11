import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';

export function useRunningWorld(): string {
  const { runningWorld } = useAppRuntime();
  return useSyncExternalStore(
    (listener) => runningWorld.onChange(listener),
    () => runningWorld.name(),
  );
}
