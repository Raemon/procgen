import type { CultureSource } from '../assembly/cultureSource';
import type { PieceSource } from '../assembly/pieceSource';
import type { WorldPalette } from './worldPalette';

export function piecesOfPalette(palette: WorldPalette): PieceSource {
  return {
    byId: (id) => palette.pieces.find((piece) => piece.id === id),
    largestFootprint: () => largestFootprintOf(palette),
  };
}

export function cultureOfPalette(palette: WorldPalette): CultureSource {
  return { byId: (id) => (id === palette.culture.id ? palette.culture : undefined) };
}

function largestFootprintOf(palette: WorldPalette): number {
  return Math.max(0, ...palette.pieces.map((piece) => Math.max(piece.width, piece.depth)));
}
