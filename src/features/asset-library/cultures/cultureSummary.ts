import { PIECE_ROLES } from '../pieces/pieceDef';
import { piecesBoundToRole, type Culture } from './cultureDef';
import { roofStyleLabel } from './roofStyleChoices';

export function proportionsSummaryOf(culture: Culture): string {
  return `${roofStyleLabel(culture.roofStyle)} roof · ${culture.storyLayers} layers per story · window every ${culture.windowEvery}`;
}

export function boundRolesSummaryOf(culture: Culture): string {
  const bound = PIECE_ROLES.filter((role) => piecesBoundToRole(culture, role).length > 0);
  return bound.length > 0
    ? `pieces bound: ${bound.join(', ')}`
    : 'no pieces bound — built from tiles alone';
}
