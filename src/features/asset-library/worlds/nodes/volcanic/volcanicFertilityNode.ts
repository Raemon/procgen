import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue, type FieldChunk } from '../../values/chunkValues';
import { type VolcanoCone } from '../../volcanic/hotspotChains';
import { SEA_LEVEL } from '../../volcanic/seaLevel';
import { ashFalloff, soilMaturity } from '../../volcanic/soilMaturity';
import { nearbyPoints } from '../../values/nearbyPoints';
import { coneOfPoint } from '../../volcanic/coneProfile';
import { CONE_SHAPE_KEYS } from '../../values/pointData';

const ALTITUDE_WEIGHT = 3;

registerNodeType({
  type: 'volcanicFertility',
  title: 'volcanic fertility',
  category: 'volcanic',
  description:
    'Soil quality from ashfall: every cone that ever erupted nearby adds ash, the eldest covering cone sets how far that ash has weathered into soil, and altitude starves the high slopes.',
  whenToUse:
    'The mask for vegetation and farmland on volcanic islands. Middle-aged islands come out richest, fresh rock and ancient leached islands poorest — scrub time and the good land moves.',
  readsTime: true,
  inputs: {
    volcanoes: {
      kind: 'points',
      requiresPointAttributes: CONE_SHAPE_KEYS,
      label: 'volcanoes',
      help: 'Volcano points whose ash builds the soil. Cones not yet born at the current time drop nothing.',
    },
    elevation: {
      kind: 'field',
      expects: 'elevation',
      label: 'elevation',
      help: 'The final eroded elevation, used to thin the soil above the shoreline shelf.',
    },
  },
  params: {
    ashRadius: {
      kind: 'int',
      label: 'ash radius',
      help: 'Tiles a cone throws ash, fading linearly to nothing at the edge.',
      min: 16,
      max: 256,
      default: 96,
    },
    peakAge: {
      kind: 'number',
      label: 'peak soil age',
      help: 'Years after eruption at which ash has fully weathered into soil. Younger is bare rock, far older is leached out.',
      min: 250_000,
      max: 4_000_000,
      step: 250_000,
      default: 2_000_000,
    },
    altitudePenalty: {
      kind: 'number',
      label: 'altitude penalty',
      help: 'How hard fertility falls off above sea level, so summits stay barren while the flanks and lowlands bloom.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: volcanicFertilityChunk,
});

function volcanicFertilityChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const elevation = ctx.fieldInput('elevation');
  const ashRadius = ctx.params.ashRadius as number;
  const cones = existingConesNear(ctx, ashRadius);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      field[y * ctx.size + x] = cellFertility(ctx, elevation, cones, x, y);
    }
  }
  return fieldValue(field);
}

function existingConesNear(ctx: ChunkGenCtx, ashRadius: number): VolcanoCone[] {
  return nearbyPoints(ctx, 'volcanoes', ashRadius)
    .map(coneOfPoint)
    .filter((cone) => cone.born <= ctx.time);
}

function cellFertility(
  ctx: ChunkGenCtx,
  elevation: FieldChunk | null,
  cones: readonly VolcanoCone[],
  x: number,
  y: number,
): number {
  const worldX = ctx.originX + x;
  const worldY = ctx.originY + y;
  const ground = elevation?.[y * ctx.size + x] ?? 0;
  if (ground <= SEA_LEVEL) return 0;
  const cover = ashCoverAt(worldX, worldY, cones, ctx.params.ashRadius as number);
  if (cover.eldestBorn === null) return 0;
  const maturity = soilMaturity(ctx.time - cover.eldestBorn, ctx.params.peakAge as number);
  return clamp01(cover.ash * maturity - altitudePenaltyAt(ctx, ground));
}

interface AshCover {
  ash: number;
  eldestBorn: number | null;
}

function ashCoverAt(
  worldX: number,
  worldY: number,
  cones: readonly VolcanoCone[],
  ashRadius: number,
): AshCover {
  const cover: AshCover = { ash: 0, eldestBorn: null };
  for (const cone of cones) {
    const falloff = ashFalloff(Math.hypot(worldX - cone.x, worldY - cone.y), ashRadius);
    if (falloff <= 0) continue;
    cover.ash += falloff * cone.height;
    if (cover.eldestBorn === null || cone.born < cover.eldestBorn) cover.eldestBorn = cone.born;
  }
  return cover;
}

function altitudePenaltyAt(ctx: ChunkGenCtx, elevation: number): number {
  const above = Math.max(0, elevation - SEA_LEVEL);
  return (ctx.params.altitudePenalty as number) * above * ALTITUDE_WEIGHT;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
