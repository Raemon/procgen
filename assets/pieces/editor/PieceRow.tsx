import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { PIECE_ROLES, type Piece } from '../pieceDef';
import { Button } from '../../../frontend/controls/Button';
import { Select } from '../../../frontend/controls/Select';
import { classes } from '../../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../../../frontend/controls/revealOnRowHover';
import { FIELD_CLASSES } from '../../../frontend/controls/fieldClasses';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import {
  deletePieceTip,
  duplicatePieceTip,
  editPieceTip,
  PIECE_NAME_TIP,
  PIECE_ROLE_TIP,
} from './help/pieceTips';
import { PieceEditorBody } from './PieceEditorBody';

export function PieceRow({
  piece,
  open,
  onToggle,
}: {
  piece: Piece;
  open: boolean;
  onToggle(): void;
}) {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <input
          type="text"
          aria-label="piece name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={piece.name}
          onChange={(event) => perform('rename_piece', { piece_id: piece.id, name: event.target.value })}
          {...tooltipHandlers(PIECE_NAME_TIP)}
        />
        <Select
          className="shrink-0 basis-28"
          fullWidth={false}
          tip={PIECE_ROLE_TIP}
          value={piece.role}
          options={PIECE_ROLES.map((role) => ({ value: role, text: role }))}
          onChange={(role) => perform('set_piece_role', { piece_id: piece.id, role })}
        />
        <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-dim">
          {piece.width}×{piece.depth}×{piece.layers}
        </span>
        <Button
          className="px-2 py-0.5"
          tip={editPieceTip(open)}
          active={open}
          onClick={onToggle}
        >
          3D
        </Button>
        <Button
          className={classes(REVEALED_ON_ROW_HOVER, 'px-2 py-0.5')}
          tip={duplicatePieceTip(piece)}
          onClick={() => perform('duplicate_piece', { piece_id: piece.id })}
        >
          ⧉
        </Button>
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          tip={deletePieceTip(piece)}
          onClick={() => perform('remove_piece', { piece_id: piece.id })}
        >
          ×
        </Button>
      </div>
      {open && <PieceEditorBody piece={piece} />}
    </div>
  );
}
