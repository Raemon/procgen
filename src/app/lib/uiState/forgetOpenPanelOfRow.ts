import { isRecordOf } from './persistedUiGuards';
import { persistedUiValue, writePersistedUiValue } from './persistedUiStore';

const NO_ENTRIES: Record<string, string> = {};

export function forgetOpenPanelOfRow(key: string, rowId: number): void {
  const entries = persistedUiValue(key, NO_ENTRIES, isRecordOf(isPanelName));
  if (!(String(rowId) in entries)) return;
  const { [String(rowId)]: forgotten, ...rest } = entries;
  writePersistedUiValue(key, rest);
}

function isPanelName(value: unknown): value is string {
  return typeof value === 'string';
}
