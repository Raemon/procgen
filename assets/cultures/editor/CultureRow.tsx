import { classes } from '../../../frontend/controls/classes';
import { DIM_READOUT_CLASSES, FIELD_CLASSES } from '../../../frontend/controls/fieldClasses';
import { PIECE_ROLES } from '../../pieces/pieceDef';
import { GABLE_ROOF, piecesBoundToRole, type Culture } from '../cultureDef';

export function CultureRow({ culture }: { culture: Culture }) {
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <span className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}>{culture.name}</span>
        <span className={DIM_READOUT_CLASSES}>{proportionsOf(culture)}</span>
      </div>
      <p className={classes(DIM_READOUT_CLASSES, 'mt-0.5')}>{boundRolesOf(culture)}</p>
    </div>
  );
}

function proportionsOf(culture: Culture): string {
  const roof = culture.roofStyle === GABLE_ROOF ? 'gable' : 'hip';
  return `${roof} roof · ${culture.storyLayers} layers per story · window every ${culture.windowEvery}`;
}

function boundRolesOf(culture: Culture): string {
  const bound = PIECE_ROLES.filter((role) => piecesBoundToRole(culture, role).length > 0);
  return bound.length > 0 ? `pieces bound: ${bound.join(', ')}` : 'no pieces bound — built from tiles alone';
}
