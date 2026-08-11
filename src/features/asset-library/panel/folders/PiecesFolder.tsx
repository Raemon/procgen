import { useEffect } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ADD_PIECE_TIP } from '@/features/asset-library/pieces/editor/help/pieceTips';
import { usePieceEntries } from '../entries/usePieceEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function PiecesFolder() {
  const { pieces, perform } = useAppRuntime();
  const { select } = useLibrarySelection();
  const entries = usePieceEntries();
  useEffect(
    () => pieces.onPieceAdded((piece) => select('pieces', String(piece.id))),
    [pieces, select],
  );

  return (
    <LibraryFolder folder="pieces" tip={FOLDER_TIPS.pieces} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="pieces" entry={entry} />
      ))}
      <Button className="mt-1 w-full" tip={ADD_PIECE_TIP} onClick={() => perform('add_piece')}>
        + add piece
      </Button>
    </LibraryFolder>
  );
}
