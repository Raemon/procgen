import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import {
  agedCone,
  agedConeHeightAt,
  type AgedCone,
  type AgingSpec,
} from '../../volcanic/coneProfile';
import { MAX_CONE_RADIUS } from '../../volcanic/hotspotChains';
import { VOLCANIC_ERA_SPAN } from '../../time/worldTime';
import { coneOfPoint, nearbyVolcanoes } from './nearbyVolcanoes';

const BASE_BELOW_SEA = 0.55;
const YEARS_PER_SHOULDER_STEP = 1_000_000;

registerNodeType({
  type: 'volcanoConeField',
  title: 'volcano cone field',
  category: 'volcanic',
  description:
    'Raises an eroding cone over every volcano point born by the current time: young cones stand tall with a crater, old ones slump into wide low shoulders and finally sink beneath the sea.',
  whenToUse:
    'The elevation of a volcanic world. Feed it hotspot chain points, max it with a seafloor noise for texture, and scrub time to watch islands rise, wear down and drown.',
  readsTime: true,
  inputs: {
    volcanoes: {
      kind: 'points',
      label: 'volcanoes',
      help: 'Volcano points carrying born dates, radii and heights, gathered from every chunk a cone could reach into.',
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'The waterline the rest of the pipeline uses. The abyssal base sits well below it so bare seafloor never surfaces.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    erosionHalfLife: {
      kind: 'number',
      label: 'erosion half-life',
      help: 'Years for a cone to lose half its height. Shorter half-lives drown the tail of a chain sooner.',
      min: 250_000,
      max: 5_000_000,
      step: 250_000,
      default: 1_500_000,
    },
    craterDepth: {
      kind: 'number',
      label: 'crater depth',
      help: 'How deep the summit bowl of a still-young cone dips. Zero gives smooth domes.',
      min: 0,
      max: 0.3,
      step: 0.01,
      default: 0.12,
    },
    shoulder: {
      kind: 'number',
      label: 'shoulder widening',
      help: 'Tiles of extra footprint a cone gains per million years, as erosion spreads its flanks outward.',
      min: 0,
      max: 32,
      step: 1,
      default: 12,
    },
  },
  output: 'field',
  generateChunk: volcanoConeFieldChunk,
});

function volcanoConeFieldChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const cones = activeConesNear(ctx);
  const base = (ctx.params.seaLevel as number) * BASE_BELOW_SEA;
  const craterDepth = ctx.params.craterDepth as number;
  for (let y = 0; y < ctx.size; y++) {
    const worldY = ctx.originY + y;
    for (let x = 0; x < ctx.size; x++) {
      const worldX = ctx.originX + x;
      field[y * ctx.size + x] = seafloorOrCones(worldX, worldY, cones, base, craterDepth);
    }
  }
  return fieldValue(field);
}

function activeConesNear(ctx: ChunkGenCtx): AgedCone[] {
  const aging = agingSpecOf(ctx);
  const cones: AgedCone[] = [];
  for (const point of nearbyVolcanoes(ctx, 'volcanoes', gatherTiles(ctx))) {
    const aged = agedCone(coneOfPoint(point), aging);
    if (aged) cones.push(aged);
  }
  return cones;
}

function agingSpecOf(ctx: ChunkGenCtx): AgingSpec {
  return {
    time: ctx.time,
    erosionHalfLife: ctx.params.erosionHalfLife as number,
    shoulder: ctx.params.shoulder as number,
  };
}

function gatherTiles(ctx: ChunkGenCtx): number {
  const widened = ((ctx.params.shoulder as number) * VOLCANIC_ERA_SPAN) / YEARS_PER_SHOULDER_STEP;
  return MAX_CONE_RADIUS + widened;
}

function seafloorOrCones(
  worldX: number,
  worldY: number,
  cones: readonly AgedCone[],
  base: number,
  craterDepth: number,
): number {
  let value = base;
  for (const cone of cones) {
    value = Math.max(value, agedConeHeightAt(cone, worldX, worldY, craterDepth));
  }
  return value;
}
