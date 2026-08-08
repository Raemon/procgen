import { useEffect } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnPieceChange } from '../../../frontend/rerenderHooks';
import { Button } from '../../../frontend/controls/Button';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { ADD_PIECE_TIP } from './help/pieceTips';
import { isNumberOrNull } from '../../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../../../frontend/uiState/usePersistedUiValue';
import { PieceRow } from './PieceRow';

export function PiecesTab() {
  const { pieces, perform } = useAppRuntime();
  const [openId, setOpenId] = usePersistedUiValue<number | null>(
    PERSISTED_UI_KEYS.openPieceId,
    null,
    isNumberOrNull,
  );
  useRerenderOnPieceChange();
  useEffect(() => pieces.onPieceAdded((piece) => setOpenId(piece.id)), [pieces]);
  return (
    <>
      {pieces.all().map((piece) => (
        <PieceRow
          key={piece.id}
          piece={piece}
          open={openId === piece.id}
          onToggle={() => setOpenId(openId === piece.id ? null : piece.id)}
        />
      ))}
      <Button className="mt-2" tip={ADD_PIECE_TIP} onClick={() => perform('add_piece')}>
        + add piece
      </Button>
      <PanelHint className="mt-2">
        Pieces are voxel stamps: layer 1 is the ground cell, higher layers stack upward. Bind them
        to any points node with display “pieces” to scatter them through the world, or press
        capture in the world view and drag a rectangle to lift a section of the world into a new
        piece.
      </PanelHint>
    </>
  );
}
