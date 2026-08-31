import { useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PIECE_ROLES, type Piece } from '../pieceDef';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { deleteRowConfirmation } from '@/features/asset-library/help/rowActionTips';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import { PieceEditorBody } from './PieceEditorBody';
import {
  deletePieceTip,
  duplicatePieceTip,
  PIECE_NAME_TIP,
  PIECE_ROLE_TIP,
} from './help/pieceTips';

export function PieceSheet({ piece }: { piece: Piece }) {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-1.5">
      <input
        type="text"
        aria-label="piece name"
        className={classes(FIELD_CLASSES, 'mb-2 w-full')}
        value={piece.name}
        onChange={(event) =>
          perform('rename_piece', { piece_id: piece.id, name: event.target.value })
        }
        {...tooltipHandlers(PIECE_NAME_TIP)}
      />
      <PieceActionsRow piece={piece} />
      <KnobRow label="role" tip={PIECE_ROLE_TIP}>
        <Select
          tip={PIECE_ROLE_TIP}
          value={piece.role}
          options={PIECE_ROLES.map((role) => ({ value: role, text: role }))}
          onChange={(role) => perform('set_piece_role', { piece_id: piece.id, role })}
        />
      </KnobRow>
      <PieceEditorBody piece={piece} />
    </div>
  );
}

function PieceActionsRow({ piece }: { piece: Piece }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisPiece(): void {
    setConfirmingDelete(false);
    perform('remove_piece', { piece_id: piece.id });
    clear();
  }

  return (
    <>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          tip={duplicatePieceTip(piece)}
          onClick={() => perform('duplicate_piece', { piece_id: piece.id })}
        >
          ⧉ duplicate
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deletePieceTip(piece)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(piece.name)}
          onConfirm={deleteThisPiece}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
