import { assetId } from '@/features/asset-library/asset';
import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';
import { newPieceWithId } from '@/features/asset-library/pieces/pieceDef';
import { paintVoxel } from '@/features/asset-library/pieces/piecePainting';
import { pieceThumbnailKey } from '@/features/asset-library/panel/icons/PieceIcon';
import { copyNameFor } from '@/features/asset-library/worlds/seeds/copyName';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const DUPLICATING_ABILITIES = [
  'duplicate_tile',
  'duplicate_item',
  'duplicate_piece',
  'duplicate_culture',
  'duplicate_creature',
  'duplicate_world_seed',
  'duplicate_template',
];

export function checkLibraryRowActions(check: CheckReporter): void {
  checkEveryLibraryFolderCanCopyItsRows(check);
  checkACopyNeverTakesANameAlreadyInUse(check);
  checkAPieceIconIncludesTheWholeRender(check);
}

function checkEveryLibraryFolderCanCopyItsRows(check: CheckReporter): void {
  const missing = DUPLICATING_ABILITIES.filter(
    (action) => !allCommands().some((spec) => spec.action === action),
  );
  check(
    'every library folder whose rows offer a copy button has an command behind it',
    missing.length === 0,
  );
}

function checkACopyNeverTakesANameAlreadyInUse(check: CheckReporter): void {
  check('the first copy of a world seed is named after it', copyNameFor('islands', []) === 'islands copy');
  check(
    'a second copy counts up instead of overwriting the first',
    copyNameFor('islands', ['islands copy']) === 'islands copy 2' &&
      copyNameFor('islands', ['islands copy', 'islands copy 2']) === 'islands copy 3',
  );
}

function checkAPieceIconIncludesTheWholeRender(check: CheckReporter): void {
  const piece = newPieceWithId(assetId<'pieces'>(0));
  paintVoxel(piece, 1, 1, 0, assetId<'tiles'>(4));
  paintVoxel(piece, 1, 1, 2, assetId<'tiles'>(7));
  const firstRender = pieceThumbnailKey(piece, (tileId) => `#${tileId}`);
  paintVoxel(piece, 1, 1, 0, assetId<'tiles'>(5));
  const changedCoveredVoxel = pieceThumbnailKey(piece, (tileId) => `#${tileId}`);
  const changedTileColor = pieceThumbnailKey(piece, (tileId) => `changed-${tileId}`);
  check(
    'a piece icon snapshot follows the whole rendered model and its tile colors',
    firstRender !== changedCoveredVoxel && changedCoveredVoxel !== changedTileColor,
  );
}
