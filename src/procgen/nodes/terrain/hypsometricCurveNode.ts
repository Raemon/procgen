import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'hypsometricCurve',
  title: 'hypsometric curve',
  category: 'terrain',
  description:
    "Bends a field so heights bunch up into a deep-ocean floor and a low continental platform with a steep slope between them — the two-humped elevation distribution Earth actually has.",
  whenToUse:
    'Right before you threshold terrain into tiles. Raw noise is single-humped, so most of the world sits near the sea line and every coast is fringed with shallows; this pushes it apart into real basins and real land.',
  inputs: {
    source: { kind: 'field', label: 'source', help: 'The elevation field to reshape.' },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'The height that stays put while everything else moves away from it. Set it to the threshold your ocean layer uses.',
      min: 0.05,
      max: 0.95,
      step: 0.01,
      default: 0.5,
    },
    steepness: {
      kind: 'number',
      label: 'slope steepness',
      help: 'How abruptly the sea floor climbs to the land platform. Low values keep a gentle shelf, high values give an abyssal drop close to shore.',
      min: 1,
      max: 30,
      step: 0.5,
      default: 9,
    },
  },
  output: 'field',
  generateChunk: hypsometricChunk,
});

function hypsometricChunk(ctx: ChunkGenCtx): ChunkValue {
  const source = ctx.fieldInput('source');
  const out = ctx.newField();
  if (!source) return fieldValue(out);
  const seaLevel = ctx.params.seaLevel as number;
  const steepness = ctx.params.steepness as number;
  for (let i = 0; i < out.length; i++) out[i] = curved(source[i]!, seaLevel, steepness);
  return fieldValue(out);
}

function curved(value: number, seaLevel: number, steepness: number): number {
  const shaped = logistic(value, seaLevel, steepness);
  if (value <= seaLevel) return seaLevel * normalizedBelow(shaped, seaLevel, steepness);
  return seaLevel + (1 - seaLevel) * normalizedAbove(shaped, seaLevel, steepness);
}

function normalizedBelow(shaped: number, seaLevel: number, steepness: number): number {
  const floorValue = logistic(0, seaLevel, steepness);
  return (shaped - floorValue) / Math.max(1e-6, 0.5 - floorValue);
}

function normalizedAbove(shaped: number, seaLevel: number, steepness: number): number {
  const peakValue = logistic(1, seaLevel, steepness);
  return (shaped - 0.5) / Math.max(1e-6, peakValue - 0.5);
}

function logistic(value: number, seaLevel: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (value - seaLevel)));
}
