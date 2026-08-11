export interface PersistedUiRecord<T> {
  valueOf(id: string): T | undefined;
  set(id: string, value: T): void;
  forget(id: string): void;
}

export function persistedUiRecordOf<T>(
  entries: Record<string, T>,
  replaceEntries: (next: Record<string, T>) => void,
): PersistedUiRecord<T> {
  return {
    valueOf: (id) => entries[id],
    set: (id, value) => replaceEntries({ ...entries, [id]: value }),
    forget: (id) => replaceEntries(entriesWithout(entries, id)),
  };
}

function entriesWithout<T>(entries: Record<string, T>, forgotten: string): Record<string, T> {
  return Object.fromEntries(Object.entries(entries).filter(([id]) => id !== forgotten));
}
