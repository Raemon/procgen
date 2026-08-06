import { readJson, writeJson } from '../../persistence/localJsonStore';
import { VIEW_MODES, type ViewMode } from './viewMode';

const VIEW_MODE_KEY = 'procgen.worldView.mode';

export function lastUsedViewMode(): ViewMode {
  const stored = readJson<string>(VIEW_MODE_KEY);
  return VIEW_MODES.find((entry) => entry.id === stored)?.id ?? '3d-god';
}

export function rememberViewMode(mode: ViewMode): void {
  writeJson(VIEW_MODE_KEY, mode);
}
