import {
  NOISE_STYLE_BILLOW,
  NOISE_STYLE_FBM,
  NOISE_STYLE_RIDGED,
  terrainOctaves,
  type OctaveSpec,
} from '../../noise/terrainOctaves';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

const STYLE_CHOICES = [
  {
    value: NOISE_STYLE_FBM,
    label: 'rolling',
    help: 'Plain fractal noise: rounded hills and basins. The base shape of lowlands and continental interiors.',
  },
  {
    value: NOISE_STYLE_RIDGED,
    label: 'ridged',
    help: 'Folds each octave at its midline so crests become sharp lines with steep flanks — the shape real mountain ranges have.',
  },
  {
    value: NOISE_STYLE_BILLOW,
    label: 'billowed',
    help: 'The inverse fold: puffy lumps with narrow creases between them. Reads as dunes, foothills, or cloud-like relief.',
  },
] as const;

registerNodeType({
  type: 'terrainNoise',
  title: 'terrain noise',
  category: 'terrain',
  description:
    'Gradient-noise terrain with a choice of crest shape, direct control of how fast detail shrinks and how fast it fades, and a grain that can be stretched out along one direction.',
  whenToUse:
    'The realistic replacement for a plain noise field. Use "ridged" for mountain ranges and "rolling" for lowlands, then blend the two with a blend fields node. Raise stretch when the ground should have a direction rather than blobs: dune trains combed by one wind, silt bars along a channel, drumlins, or the dip of tilted strata.',
  inputs: {},
  params: {
    scale: {
      kind: 'number',
      label: 'scale',
      help: 'Feature size. Low values give continent-wide shapes, high values give tight local relief.',
      min: 0.002,
      max: 0.2,
      step: 0.002,
      default: 0.02,
    },
    style: {
      kind: 'choice',
      label: 'crest shape',
      help: 'How each octave is folded before it is summed. This is what decides whether crests are rounded, sharp, or lumpy.',
      options: STYLE_CHOICES,
      default: NOISE_STYLE_FBM,
    },
    octaves: {
      kind: 'int',
      label: 'octaves',
      help: 'How many layers of detail are summed. Each one is finer and fainter than the last.',
      min: 1,
      max: 10,
      default: 6,
    },
    lacunarity: {
      kind: 'number',
      label: 'lacunarity',
      help: 'How much smaller each octave is than the one before. 2 is the usual doubling; higher values skip detail scales.',
      min: 1.5,
      max: 3.5,
      step: 0.05,
      default: 2,
    },
    gain: {
      kind: 'number',
      label: 'gain',
      help: 'How much fainter each octave is than the one before. Low gain is smooth and worn; high gain is rough and jagged.',
      min: 0.2,
      max: 0.8,
      step: 0.01,
      default: 0.5,
    },
    angle: {
      kind: 'number',
      label: 'grain angle',
      help: 'Which way the pattern repeats, in degrees anticlockwise from +x — for dunes, the wind. The stretched crests run at right angles to it. Nothing changes until stretch leaves 1.',
      min: 0,
      max: 360,
      step: 5,
      default: 0,
    },
    stretch: {
      kind: 'number',
      label: 'stretch',
      help: 'How far features are drawn out across the angle. 1 is the shapeless noise everything else in this world makes; 6 or more gives dune trains, silt bars, strata and drumlins their length.',
      min: 1,
      max: 12,
      step: 0.5,
      default: 1,
    },
  },
  output: 'field',
  outputSemantic: 'elevation',
  generateChunk: terrainNoiseChunk,
});

function terrainNoiseChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const seed = ctx.hashSeed('terrain noise');
  const scale = ctx.params.scale as number;
  const spec = octaveSpecOf(ctx);
  const grain = grainOf(ctx);
  for (let y = 0; y < ctx.size; y++) {
    const worldY = ctx.originY + y;
    for (let x = 0; x < ctx.size; x++) {
      const worldX = ctx.originX + x;
      const acrossGrain = worldX * grain.cos + worldY * grain.sin;
      const alongGrain = (worldY * grain.cos - worldX * grain.sin) / grain.stretch;
      field[y * ctx.size + x] = terrainOctaves(acrossGrain * scale, alongGrain * scale, seed, spec);
    }
  }
  return fieldValue(field);
}

interface Grain {
  cos: number;
  sin: number;
  stretch: number;
}

function grainOf(ctx: ChunkGenCtx): Grain {
  const radians = ((ctx.params.angle as number) * Math.PI) / 180;
  return {
    cos: Math.cos(radians),
    sin: Math.sin(radians),
    stretch: Math.max(1e-6, ctx.params.stretch as number),
  };
}

function octaveSpecOf(ctx: ChunkGenCtx): OctaveSpec {
  return {
    style: ctx.params.style as number,
    octaves: ctx.params.octaves as number,
    lacunarity: ctx.params.lacunarity as number,
    gain: ctx.params.gain as number,
  };
}
