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

export function useRerenderOnWorldChange(): void {
  useRerenderWhen(useAppRuntime().subscribeToWorldChange);
}

function useRerenderWhen(subscribe: Subscribe): void {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribe(rerender), [subscribe]);
}
