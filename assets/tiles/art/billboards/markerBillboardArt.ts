import type { TileDef } from '../../tileDef';
import type { CubeFaceArt } from '../../tileFaceArt';
import { pixelNoise } from '../artNoise';
import { TILE_ART_SIZE } from '../artSize';
import { animatedCubeArt } from '../cubeArtFrom';
import type { PixelPainter } from '../pixelCanvas';
import { billboardHeightOfTile, billboardKindOfTile, type BillboardKind } from './billboardKind';
import { billboardPalette, type BillboardPalette } from './billboardPalette';
import { bloomPainter } from './bloomPainter';
import { boulderPainter } from './boulderPainter';
import { broadleafPainter } from './broadleafPainter';
import { coniferPainter } from './coniferPainter';
import { shrubPainter } from './shrubPainter';

const PAINTERS: Record<
  BillboardKind,
  (size: number, palette: BillboardPalette, seed: number) => PixelPainter
> = {
  conifer: coniferPainter,
  broadleaf: broadleafPainter,
  shrub: shrubPainter,
  boulder: boulderPainter,
  bloom: bloomPainter,
};

const artByTileId = new Map<number, { look: string; art: CubeFaceArt }>();

export function markerBillboardArt(tile: TileDef): CubeFaceArt {
  const look = billboardLookOf(tile);
  const remembered = artByTileId.get(tile.id);
  if (remembered?.look === look) return remembered.art;
  const art = animatedCubeArt(TILE_ART_SIZE, [{ color: { sides: billboardPainterFor(tile) } }]);
  artByTileId.set(tile.id, { look, art });
  return art;
}

function billboardLookOf(tile: TileDef): string {
  return `${tile.color}|${billboardKindOfTile(tile)}|${billboardHeightOfTile(tile)}`;
}

function billboardPainterFor(tile: TileDef): PixelPainter {
  const palette = billboardPalette(tile.color, petalChoiceOf(tile));
  return PAINTERS[billboardKindOfTile(tile)](TILE_ART_SIZE, palette, tile.id);
}

function petalChoiceOf(tile: TileDef): number {
  return Math.round(pixelNoise(tile.id, 0, tile.id) * 1000);
}
