import { worldCoordOfCell } from '../../cellStride';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { coneProfileAt } from '../../volcanic/coneProfile';
import { MAX_CONE_RADIUS, type VolcanoCone } from '../../volcanic/hotspotChains';
import { coneOfPoint, nearbyVolcanoes } from './nearbyVolcanoes';

export const NEVER_LAND = 0;

registerNodeType({
  type: 'islandBirthField',
  title: 'island birth field',
  category: 'volcanic',
  description:
    'Writes, at every cell, the born date of the earliest cone whose full un-eroded footprint clears sea level there; cells no cone ever lifts above the water stay at 0, which means never.',
  whenToUse:
    'A memory of when land first existed, for nodes that care how old an island is rather than how tall it stands today. Downstream consumers must treat 0 as never-land, not as a date.',
  inputs: {
    volcanoes: {
      kind: 'points',
      label: 'volcanoes',
      help: 'Volcano points carrying born dates, radii and heights. Only their un-eroded shape matters here.',
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'The waterline a footprint must clear to count as land. Match the cone field so both agree on the coast.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
  },
  output: 'field',
  generateChunk: islandBirthChunk,
});

function islandBirthChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const cones = nearbyVolcanoes(ctx, 'volcanoes', MAX_CONE_RADIUS).map(coneOfPoint);
  const seaLevel = ctx.params.seaLevel as number;
  for (let y = 0; y < ctx.size; y++) {
    const worldY = worldCoordOfCell(ctx.originY + y, ctx.stride);
    for (let x = 0; x < ctx.size; x++) {
      const worldX = worldCoordOfCell(ctx.originX + x, ctx.stride);
      field[y * ctx.size + x] = earliestBirthClearing(worldX, worldY, cones, seaLevel);
    }
  }
  return fieldValue(field);
}

function earliestBirthClearing(
  worldX: number,
  worldY: number,
  cones: readonly VolcanoCone[],
  seaLevel: number,
): number {
  let earliest = NEVER_LAND;
  for (const cone of cones) {
    const distance = Math.hypot(worldX - cone.x, worldY - cone.y);
    if (coneProfileAt(distance, cone.radius, cone.height) <= seaLevel) continue;
    if (earliest === NEVER_LAND || cone.born < earliest) earliest = cone.born;
  }
  return earliest;
}
