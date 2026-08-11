import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';
import { newPieceWithId } from '@/features/asset-library/pieces/pieceDef';
import { paintVoxel } from '@/features/asset-library/pieces/piecePainting';
import { pieceTopColors } from '@/features/asset-library/pieces/pieceTopColors';
import { copyNameFor } from '@/features/asset-library/worlds/presets/copyName';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const DUPLICATING_ABILITIES = [
  'duplicate_tile',
  'duplicate_item',
  'duplicate_piece',
  'duplicate_culture',
  'duplicate_creature',
  'duplicate_preset',
  'duplicate_template',
];

export function checkLibraryRowActions(check: CheckReporter): void {
  checkEveryLibraryFolderCanCopyItsRows(check);
  checkACopyNeverTakesANameAlreadyInUse(check);
  checkAPieceIconShowsWhatIsOnTop(check);
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
  check('the first copy of a world is named after it', copyNameFor('islands', []) === 'islands copy');
  check(
    'a second copy counts up instead of overwriting the first',
    copyNameFor('islands', ['islands copy']) === 'islands copy 2' &&
      copyNameFor('islands', ['islands copy', 'islands copy 2']) === 'islands copy 3',
  );
}

function checkAPieceIconShowsWhatIsOnTop(check: CheckReporter): void {
  const piece = newPieceWithId(0);
  paintVoxel(piece, 1, 1, 0, 4);
  paintVoxel(piece, 1, 1, 2, 7);
  const colors = pieceTopColors(piece, (tileId) => `#${tileId}`);
  check(
    'a piece seen from above shows the highest painted voxel of each column, and nothing where none is painted',
    colors.length === piece.width * piece.depth &&
      colors[piece.width + 1] === '#7' &&
      colors[0] === null,
  );
}
