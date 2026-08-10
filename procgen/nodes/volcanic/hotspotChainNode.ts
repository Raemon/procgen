import { worldCoordOfCell } from '../../cellStride';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type WorldPoint } from '../../values/chunkValues';
import { BORN, CHAIN_ID, CONE_HEIGHT, CONE_RADIUS } from '../../values/pointData';
import {
  conesOverlapping,
  type HotspotChainSpec,
  type TileRect,
  type VolcanoCone,
} from '../../volcanic/hotspotChains';

export const VOLCANO_TAG = 'volcano';

registerNodeType({
  type: 'hotspotChain',
  title: 'hotspot chains',
  category: 'volcanic',
  description:
    'Mantle hotspots on a jittered lattice, each dragging a line of volcano points across the plate: the cone over the plume is the youngest and every cone behind it is one eruption older.',
  whenToUse:
    'The seed of a volcanic world. Wire its points into a volcano cone field to raise the islands, and into fertility and deposit nodes so soil and riches remember which cone made them.',
  inputs: {},
  params: {
    hotspotSpacing: {
      kind: 'int',
      label: 'hotspot spacing',
      help: 'Pitch of the mantle lattice in tiles. One candidate hotspot per cell, so smaller spacing means more chains.',
      min: 128,
      max: 1024,
      default: 384,
    },
    driftRate: {
      kind: 'number',
      label: 'drift rate',
      help: 'Tiles of plate drift per year. At 0.0004 a chain stretches about two thousand tiles over the volcanic era.',
      min: 0.0001,
      max: 0.002,
      step: 0.0001,
      default: 0.0004,
    },
    eruptionPeriod: {
      kind: 'number',
      label: 'eruption period',
      help: 'Years between one cone and the next along a chain. Half a million years yields roughly ten cones per chain.',
      min: 100_000,
      max: 1_000_000,
      step: 25_000,
      default: 500_000,
    },
    coneRadius: {
      kind: 'int',
      label: 'cone radius',
      help: 'Footprint of a full-grown cone in tiles. The very youngest cone is still growing, so it carries a smaller radius.',
      min: 24,
      max: 96,
      default: 48,
    },
    coneHeight: {
      kind: 'number',
      label: 'cone height',
      help: 'Summit height of a fresh cone before erosion, with a little per-cone jitter so no two peaks match.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85,
    },
    chainFraction: {
      kind: 'number',
      label: 'chain fraction',
      help: 'Share of lattice cells that actually host a chain. Low values leave wide empty ocean between archipelagos.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.35,
    },
  },
  output: 'points',
  generateChunk: hotspotChainChunk,
});

function hotspotChainChunk(ctx: ChunkGenCtx): ChunkValue {
  const spec = chainSpecOf(ctx);
  return pointsValue(conesOverlapping(chunkTileRect(ctx), spec).map(volcanoPointOf));
}

function chainSpecOf(ctx: ChunkGenCtx): HotspotChainSpec {
  return {
    spacing: ctx.params.hotspotSpacing as number,
    driftRate: ctx.params.driftRate as number,
    eruptionPeriod: ctx.params.eruptionPeriod as number,
    coneRadius: ctx.params.coneRadius as number,
    coneHeight: ctx.params.coneHeight as number,
    chainFraction: ctx.params.chainFraction as number,
    seed: ctx.hashSeed('hotspot lattice'),
  };
}

function chunkTileRect(ctx: ChunkGenCtx): TileRect {
  return {
    minX: worldCoordOfCell(ctx.originX, ctx.stride),
    minY: worldCoordOfCell(ctx.originY, ctx.stride),
    maxX: worldCoordOfCell(ctx.originX + ctx.size, ctx.stride),
    maxY: worldCoordOfCell(ctx.originY + ctx.size, ctx.stride),
  };
}

function volcanoPointOf(cone: VolcanoCone): WorldPoint {
  return {
    x: cone.x,
    y: cone.y,
    tag: VOLCANO_TAG,
    data: {
      [BORN]: cone.born,
      [CHAIN_ID]: cone.chainId,
      [CONE_RADIUS]: cone.radius,
      [CONE_HEIGHT]: cone.height,
    },
  };
}
