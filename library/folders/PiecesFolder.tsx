import { useEffect } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnPieceChange } from '../../frontend/rerenderHooks';
import { Button } from '../../frontend/controls/Button';
import { ADD_PIECE_TIP } from '../../assets/pieces/editor/help/pieceTips';
import { FOLDER_TIPS } from '../help/libraryTips';
import { LibraryFolder } from '../panel/LibraryFolder';
import { LibraryRow } from '../panel/LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function PiecesFolder() {
  const { pieces, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnPieceChange();
  useEffect(
    () => pieces.onPieceAdded((piece) => select('pieces', String(piece.id))),
    [pieces, select],
  );
  const all = pieces.all();

  return (
    <LibraryFolder folder="pieces" tip={FOLDER_TIPS.pieces} count={all.length}>
      {all.map((piece) => (
        <LibraryRow
          key={piece.id}
          folder="pieces"
          entryKey={String(piece.id)}
          name={piece.name}
          note={`${piece.width}×${piece.depth}×${piece.layers}`}
          tip={{
            title: piece.name,
            body: `piece ${piece.id} · role ${piece.role} · ${piece.width}×${piece.depth}, ${piece.layers} layers`,
          }}
        />
      ))}
      <Button className="mt-1 w-full" tip={ADD_PIECE_TIP} onClick={() => perform('add_piece')}>
        + add piece
      </Button>
    </LibraryFolder>
  );
}
