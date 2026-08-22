import type { PieceId } from '@/features/asset-library/asset';
import type { CultureAssets } from './cultureAssets';
import type { Culture } from './cultureDef';

export function forgetRemovedPieceInRoleBindings(cultures: CultureAssets, pieceId: PieceId): void {
  for (const culture of [...cultures.all()]) {
    if (!bindsPiece(culture, pieceId)) continue;
    cultures.update(culture.id, { roleBindings: roleBindingsWithoutPiece(culture, pieceId) });
  }
}

export function roleBindingsWithoutPiece(culture: Culture, pieceId: PieceId): Culture['roleBindings'] {
  return Object.fromEntries(
    Object.entries(culture.roleBindings).map(([role, pieceIds]) => [
      role,
      pieceIds.filter((id) => id !== pieceId),
    ]),
  );
}

function bindsPiece(culture: Culture, pieceId: PieceId): boolean {
  return Object.values(culture.roleBindings).some((pieceIds) => pieceIds.includes(pieceId));
}
