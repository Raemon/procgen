import { worldCoordOfCell } from '../../cellStride';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import {
  plateContactAt,
  platesOverlapping,
  type PlateContact,
  type PlateLatticeSpec,
} from './plateLattice';

const RIDGE_SHARE_OF_RANGE = 0.3;
const RIFT_SHARE_OF_BASIN = 0.5;
const TRENCH_SHARE_OF_RANGE = 0.6;

registerNodeType({
  type: 'tectonicUplift',
  title: 'tectonic uplift',
  category: 'terrain',
  description:
    'Lays out drifting plates and returns the elevation their collisions produce: deep oceanic plates, high continental ones, mountain belts where plates converge, trenches where one dives under another, and rifts where they pull apart.',
  whenToUse:
    'The bottom of a realistic world. Earth-like terrain is ranges in long belts and oceans in wide basins — noise alone gives isotropic blobs, so start from this and add noise for detail.',
  inputs: {},
  params: {
    plateSize: {
      kind: 'int',
      label: 'plate size',
      help: 'Rough width of one plate in tiles. This sets how far apart continents and mountain belts are.',
      min: 64,
      max: 4096,
      default: 512,
    },
    oceanFraction: {
      kind: 'number',
      label: 'oceanic share',
      help: 'Fraction of plates that are oceanic rather than continental. Earth sits near 0.6.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.6,
    },
    beltWidth: {
      kind: 'int',
      label: 'belt width',
      help: 'How far from a plate boundary its mountains, trenches and rifts reach, in tiles.',
      min: 4,
      max: 512,
      default: 72,
    },
    rangeHeight: {
      kind: 'number',
      label: 'range height',
      help: 'How high converging plates push their mountain belt above the surrounding land.',
      min: 0,
      max: 0.4,
      step: 0.01,
      default: 0.3,
    },
    landHeight: {
      kind: 'number',
      label: 'land height',
      help: 'How high continental crust sits. The margin between this and your sea level decides how much of a continent stays dry once noise is added: a small margin drowns the edges into bays and inland seas.',
      min: 0.5,
      max: 0.9,
      step: 0.01,
      default: 0.6,
    },
    basinDepth: {
      kind: 'number',
      label: 'basin depth',
      help: 'How far an oceanic plate sits below a continental one. This is what makes oceans read as basins instead of flooded lowlands.',
      min: 0,
      max: 0.6,
      step: 0.01,
      default: 0.34,
    },
  },
  output: 'field',
  generateChunk: tectonicUpliftChunk,
});

function tectonicUpliftChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const plates = platesOverlapping(
    worldCoordOfCell(ctx.originX, ctx.stride),
    worldCoordOfCell(ctx.originY, ctx.stride),
    worldCoordOfCell(ctx.originX + ctx.size - 1, ctx.stride),
    worldCoordOfCell(ctx.originY + ctx.size - 1, ctx.stride),
    latticeSpecOf(ctx),
  );
  for (let y = 0; y < ctx.size; y++) {
    const worldY = worldCoordOfCell(ctx.originY + y, ctx.stride);
    for (let x = 0; x < ctx.size; x++) {
      const contact = plateContactAt(plates, worldCoordOfCell(ctx.originX + x, ctx.stride), worldY);
      field[y * ctx.size + x] = elevationOfContact(ctx, contact);
    }
  }
  return fieldValue(field);
}

function latticeSpecOf(ctx: ChunkGenCtx): PlateLatticeSpec {
  return {
    plateSize: ctx.params.plateSize as number,
    oceanFraction: ctx.params.oceanFraction as number,
    seed: ctx.hashSeed('plates'),
  };
}

function elevationOfContact(ctx: ChunkGenCtx, contact: PlateContact): number {
  const landHeight = ctx.params.landHeight as number;
  const base = contact.plate.oceanic ? landHeight - (ctx.params.basinDepth as number) : landHeight;
  return clampToUnit(base + boundaryEffect(ctx, contact) * boundaryInfluence(ctx, contact));
}

function boundaryInfluence(ctx: ChunkGenCtx, contact: PlateContact): number {
  const nearness = 1 - Math.min(1, contact.boundaryDistance / (ctx.params.beltWidth as number));
  return nearness * nearness * (3 - 2 * nearness);
}

function boundaryEffect(ctx: ChunkGenCtx, contact: PlateContact): number {
  return contact.convergence > 0 ? convergentEffect(ctx, contact) : divergentEffect(ctx, contact);
}

function convergentEffect(ctx: ChunkGenCtx, contact: PlateContact): number {
  const rangeHeight = ctx.params.rangeHeight as number;
  const subducts = contact.plate.oceanic && !contact.neighbor.oceanic;
  const lift = subducts ? -rangeHeight * TRENCH_SHARE_OF_RANGE : rangeHeight;
  return lift * contact.convergence;
}

function divergentEffect(ctx: ChunkGenCtx, contact: PlateContact): number {
  const spread = -contact.convergence;
  if (contact.plate.oceanic) return (ctx.params.rangeHeight as number) * RIDGE_SHARE_OF_RANGE * spread;
  return -(ctx.params.basinDepth as number) * RIFT_SHARE_OF_BASIN * spread;
}

function clampToUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}
