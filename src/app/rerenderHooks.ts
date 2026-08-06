import { useCallback, useEffect, useReducer } from 'react';
import { useAppRuntime } from './appRuntimeContext';

type Subscribe = (listener: () => void) => () => void;

export function useRerenderOnPipelineChange(): void {
  const { store } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => store.onChange(listener), [store]));
}

export function useRerenderOnTilesetChange(): void {
  const { tileset } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => tileset.onChange(listener), [tileset]));
}

export function useRerenderOnPrefabChange(): void {
  const { prefabs } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => prefabs.onChange(listener), [prefabs]));
}

export function useRerenderOnCreatureChange(): void {
  const { creatures } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => creatures.onChange(listener), [creatures]));
}

export function useRerenderOnCaptureChange(): void {
  const { capture } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => capture.onChange(listener), [capture]));
}

export function useRerenderOnCreatureClockChange(): void {
  const { clock } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => clock.onRunStateChange(listener), [clock]));
}

export function useRerenderOnWorldChange(): void {
  useRerenderWhen(useAppRuntime().subscribeToWorldChange);
}

export function useRerenderOnPlayerMove(): void {
  const { world } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => world.on('player-moved', listener), [world]));
}

function useRerenderWhen(subscribe: Subscribe): void {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribe(rerender), [subscribe]);
}
