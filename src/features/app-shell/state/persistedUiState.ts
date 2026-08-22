import type { PersistedUiState } from '../persistence/persistedDocumentContents';

export function persistedUiStateFrom(raw: unknown): PersistedUiState {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  return raw as PersistedUiState;
}
