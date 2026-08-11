import { useCallback, useSyncExternalStore } from 'react';
import {
  persistedUiValue,
  subscribeToPersistedUiValue,
  writePersistedUiValue,
} from './persistedUiStore';

export function usePersistedUiValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToPersistedUiValue(key, listener),
    [key],
  );
  const readValue = useCallback(() => persistedUiValue(key, fallback, isValid), [key, fallback, isValid]);
  const value = useSyncExternalStore(subscribe, readValue, readValue);
  const setValue = useCallback((next: T) => writePersistedUiValue(key, next), [key]);
  return [value, setValue];
}
