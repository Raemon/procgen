import {
  persistedUiValue,
  writePersistedUiValue,
} from '@/features/app-shell/state/persistedUiStore';
import { VIEW_MODES, type ViewMode } from './viewMode';

const VIEW_MODE_KEY = 'worldView.mode';
const FALLBACK_VIEW_MODE: ViewMode = '3d-god';

export function lastUsedViewMode(): ViewMode {
  return persistedUiValue<ViewMode>(VIEW_MODE_KEY, FALLBACK_VIEW_MODE, isViewMode);
}

export function rememberViewMode(mode: ViewMode): void {
  writePersistedUiValue(VIEW_MODE_KEY, mode);
}

function isViewMode(value: unknown): value is ViewMode {
  return VIEW_MODES.some((entry) => entry.id === value);
}
