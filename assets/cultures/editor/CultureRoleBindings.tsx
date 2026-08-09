import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { useRerenderOnPieceChange } from '../../../frontend/rerenderHooks';
import type { Culture } from '../cultureDef';
import { pieceOffersPerRole } from '../pieceOffersPerRole';
import { CultureDrawer } from './CultureDrawer';
import { CultureRoleBindingRow } from './CultureRoleBindingRow';

export function CultureRoleBindings({ culture }: { culture: Culture }) {
  const { pieces } = useAppRuntime();
  useRerenderOnPieceChange();
  const offers = pieceOffersPerRole(pieces.all(), culture);
  return (
    <CultureDrawer>
      {offers.map((offer) => (
        <CultureRoleBindingRow
          key={offer.role}
          culture={culture}
          role={offer.role}
          offered={offer.offered}
        />
      ))}
      {offers.length === 0 && (
        <PanelHint>
          No piece carries a building role yet. Give a piece a role in the pieces tab and it becomes
          bindable here.
        </PanelHint>
      )}
      <PanelHint>
        Only roles some piece was authored for are listed. Bind several pieces to one role and the
        assembler rolls between them per cell; leave a role unbound and it is painted from the
        culture tiles instead.
      </PanelHint>
    </CultureDrawer>
  );
}
