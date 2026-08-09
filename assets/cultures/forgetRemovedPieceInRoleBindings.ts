import type { CultureAssets } from './cultureAssets';
import type { Culture } from './cultureDef';

export function forgetRemovedPieceInRoleBindings(cultures: CultureAssets, pieceId: number): void {
  for (const culture of [...cultures.all()]) {
    if (!bindsPiece(culture, pieceId)) continue;
    cultures.update(culture.id, { roleBindings: roleBindingsWithoutPiece(culture, pieceId) });
  }
}

export function roleBindingsWithoutPiece(culture: Culture, pieceId: number): Culture['roleBindings'] {
  return Object.fromEntries(
    Object.entries(culture.roleBindings).map(([role, pieceIds]) => [
      role,
      pieceIds.filter((id) => id !== pieceId),
    ]),
  );
}

function bindsPiece(culture: Culture, pieceId: number): boolean {
  return Object.values(culture.roleBindings).some((pieceIds) => pieceIds.includes(pieceId));
}
