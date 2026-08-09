import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { KnobRow } from '../../../frontend/controls/KnobRow';
import type { Piece, PieceRole } from '../../pieces/pieceDef';
import { piecesBoundToRole, type Culture } from '../cultureDef';
import { pieceIdsWithPieceToggled } from '../pieceOffersPerRole';
import { bindPieceTip, roleBindingTip, unbindRoleTip } from './help/cultureTips';

const CHIP_CLASSES = 'px-1.5 py-0.5 text-[11px]';

export function CultureRoleBindingRow({
  culture,
  role,
  offered,
}: {
  culture: Culture;
  role: PieceRole;
  offered: readonly Piece[];
}) {
  const { perform } = useAppRuntime();
  const bound = piecesBoundToRole(culture, role);
  const bind = (pieceIds: readonly number[]) =>
    perform('bind_culture_role', { culture_id: culture.id, role, piece_ids: [...pieceIds] });
  return (
    <KnobRow label={role} tip={roleBindingTip(role, bound.length)} className="items-start">
      <div className="flex flex-wrap gap-1">
        {offered.map((piece) => (
          <Button
            key={piece.id}
            className={CHIP_CLASSES}
            active={bound.includes(piece.id)}
            tip={bindPieceTip(piece, role)}
            onClick={() => bind(pieceIdsWithPieceToggled(bound, piece.id))}
          >
            {piece.name}
          </Button>
        ))}
      </div>
      {bound.length > 0 && (
        <Button className={CHIP_CLASSES} tip={unbindRoleTip(role)} onClick={() => bind([])}>
          clear
        </Button>
      )}
    </KnobRow>
  );
}
