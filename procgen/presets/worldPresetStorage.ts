import { readPersistedFile, writePersistedFile } from '../../frontend/persistence/repoFileStore';
import { sanitizeWorldPresets, type WorldPreset } from './worldPreset';

const FILE_NAME = 'worldPresets';

export function loadSavedWorldPresets(): WorldPreset[] {
  return sanitizeWorldPresets(readPersistedFile(FILE_NAME));
}

export function storeSavedWorldPresets(presets: readonly WorldPreset[]): void {
  writePersistedFile(FILE_NAME, presets);
}
