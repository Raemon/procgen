import { useCallback, useEffect, useReducer } from 'react';
import { useAppRuntime } from './appRuntimeContext';

type Subscribe = (listener: () => void) => () => void;

export function useRerenderOnTileAssetChange(): void {
  const { tileAssets } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => tileAssets.onChange(listener), [tileAssets]));
}

export function useRerenderOnPieceChange(): void {
  const { pieces } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => pieces.onChange(listener), [pieces]));
}

export function useRerenderOnCultureChange(): void {
  const { cultures } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => cultures.onChange(listener), [cultures]));
}

export function useRerenderOnCreatureChange(): void {
  const { creatures } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => creatures.onChange(listener), [creatures]));
}

export function useRerenderOnItemChange(): void {
  const { items } = useAppRuntime();
  useRerenderWhen(useCallback((listener: () => void) => items.onChange(listener), [items]));
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

function useRerenderWhen(subscribe: Subscribe): void {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => subscribe(rerender), [subscribe]);
}
