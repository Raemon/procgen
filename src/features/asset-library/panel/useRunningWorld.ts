import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';

export function useRunningWorld(): string {
  const { runningWorld } = useAppRuntime();
  return useSyncExternalStore(
    (listener) => runningWorld.onChange(listener),
    () => runningWorld.name(),
  );
}
