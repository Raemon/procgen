import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { ASSET_ICON_PX } from '../panel/icons/AssetIconFrame';
import {
  isLibraryViewMode,
  LIBRARY_GRID_PREVIEW_PX,
} from '../panel/libraryViewMode';

export function checkLibraryViewMode(check: CheckReporter): void {
  check(
    'the library accepts only its two rendered layouts as persisted view modes',
    isLibraryViewMode('rows') && isLibraryViewMode('grid') && !isLibraryViewMode('cards'),
  );
  check(
    'the grid preview is exactly twice the compact row preview size',
    LIBRARY_GRID_PREVIEW_PX === ASSET_ICON_PX * 2,
  );
}
