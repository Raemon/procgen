import { isRecordOf } from './persistedUiGuards';
import { usePersistedUiValue } from './usePersistedUiValue';

export interface PersistedUiRecord<T> {
  valueOf(id: string): T | undefined;
  set(id: string, value: T): void;
}

const NO_ENTRIES = {};

export function usePersistedUiRecord<T>(
  key: string,
  isEntry: (value: unknown) => value is T,
): PersistedUiRecord<T> {
  const [entries, setEntries] = usePersistedUiValue<Record<string, T>>(
    key,
    NO_ENTRIES,
    isRecordOf(isEntry),
  );
  return {
    valueOf: (id) => entries[id],
    set: (id, value) => setEntries({ ...entries, [id]: value }),
  };
}
