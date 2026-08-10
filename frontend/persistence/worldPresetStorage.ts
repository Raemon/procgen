import { readPersistedFile, writePersistedFile } from './repoFileStore';
import { sanitizeWorldPresets, type WorldPreset } from '../../procgen/presets/worldPreset';
import type { PersistedCollection } from '../../procgen/persistence/persistedCollection';

const FILE_NAME = 'worldPresets';

export function persistedWorldPresets(): PersistedCollection<WorldPreset> {
  return {
    load: () => sanitizeWorldPresets(readPersistedFile(FILE_NAME)),
    store: (presets) => writePersistedFile(FILE_NAME, presets),
  };
}
