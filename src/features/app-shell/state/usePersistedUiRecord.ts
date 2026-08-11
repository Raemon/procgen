import { isRecordOf } from './persistedUiGuards';
import { persistedUiRecordOf, type PersistedUiRecord } from './persistedUiRecordOf';
import { usePersistedUiValue } from './usePersistedUiValue';

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
  return persistedUiRecordOf(entries, setEntries);
}
