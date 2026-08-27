import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { nearbyPoints } from '../../values/nearbyPoints';
import { villageHashSeedAt } from './villageHashSeed';
import {
  layoutForCenter,
  planCoversPlazaCell,
  planCoversStreetCell,
  type VillagePlan,
} from './villageLayout';
import { villageLayoutKnobsOf, VILLAGE_LAYOUT_PARAMS } from './villageLayoutParams';
import { BORN } from '../../values/pointData';

registerNodeType({
  type: 'villageStreets',
  title: 'village streets',
  category: 'settlement',
  description:
    'Paves every nearby village: a main street through the center, a cross lane once the village is big enough, and a plaza where they meet.',
  whenToUse:
    'The ground a village stands on. Feed it the same centers node and the same layout knobs as the village plots node, and the paving will always line up with the buildings.',
  inputs: {
    centers: {
      kind: 'points',
      requiresPointAttributes: [BORN],
      label: 'centers',
      help: 'A village centers node. Every center within the layout radius paves its own streets into this chunk.',
    },
  },
  params: {
    ...VILLAGE_LAYOUT_PARAMS,
    streetTile: { kind: 'tile', label: 'street', help: 'Tile paved along the main street and the cross lane.' },
    plazaTile: { kind: 'tile', label: 'plaza', help: 'Tile paved across the open square at the village center.' },
  },
  output: 'tiles',
  generateChunk: villageStreetsChunk,
});

function villageStreetsChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  if (!ctx.pointsInput('centers')) return tilesValue(tiles);
  const knobs = villageLayoutKnobsOf(ctx);
  for (const center of nearbyPoints(ctx, 'centers', knobs.radius)) {
    paveVillage(ctx, layoutForCenter(villageHashSeedAt(center.x, center.y), center, knobs), tiles);
  }
  return tilesValue(tiles);
}

function paveVillage(ctx: ChunkGenCtx, plan: VillagePlan, tiles: TilesChunk): void {
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      paveCell(ctx, plan, tiles, x, y);
    }
  }
}

function paveCell(
  ctx: ChunkGenCtx,
  plan: VillagePlan,
  tiles: TilesChunk,
  x: number,
  y: number,
): void {
  const worldX = ctx.originX + x;
  const worldY = ctx.originY + y;
  if (planCoversPlazaCell(plan, worldX, worldY)) tiles[y * ctx.size + x] = ctx.params.plazaTile as number;
  else if (planCoversStreetCell(plan, worldX, worldY)) tiles[y * ctx.size + x] = ctx.params.streetTile as number;
}
