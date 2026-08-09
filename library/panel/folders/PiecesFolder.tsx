import { useEffect } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { ADD_PIECE_TIP } from '../../../assets/pieces/editor/help/pieceTips';
import { usePieceEntries } from '../entries/usePieceEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function PiecesFolder() {
  const { pieces, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
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
