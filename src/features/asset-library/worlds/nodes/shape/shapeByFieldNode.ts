import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx, ParamValue } from '../../nodeType';
import {
  PLATEAU_CHOICE,
  PROFILE_CHOICES,
  PROFILE_PLATEAU,
  PROFILE_STEPS,
  plateauValueAt,
  profileValueAt,
  type FieldProfile,
  type PlateauProfile,
} from '../../shape/fieldProfile';
import { fieldValue, newFieldChunk, type ChunkValue } from '../../values/chunkValues';

const SHAPE_SUBTRACT = 0;
const SHAPE_ADD = 1;
const SHAPE_MAX = 2;
const SHAPE_MIN = 3;
const SHAPE_TO_LEVEL = 4;

const OPERATION_CHOICES = [
  { value: SHAPE_SUBTRACT, label: 'subtract', help: 'Cuts the shaped amount out of the base. Canyons, moats, quarry pits.' },
  { value: SHAPE_ADD, label: 'add', help: 'Piles the shaped amount onto the base. Berms, levees, crater rims, reef rings.' },
  { value: SHAPE_MAX, label: 'max', help: 'Keeps the higher of the base and the shaped amount, so the shape only ever shows where the base is lower.' },
  { value: SHAPE_MIN, label: 'min', help: 'Keeps the lower of the two, so the shape acts as a ceiling the base cannot poke through.' },
  {
    value: SHAPE_TO_LEVEL,
    label: 'to level',
    help: 'Pulls the base toward the level field, all the way where the profile reads 1. This is what pins a floor to a per-cell height instead of one number for the whole world.',
  },
] as const;

const PROFILE_OPTIONS = [...PROFILE_CHOICES, PLATEAU_CHOICE] as const;

registerNodeType({
  type: 'shapeByField',
  title: 'shape by field',
  category: 'shape',
  description:
    'Reads a control field through a profile and uses the answer to cut into, pile onto, cap, or pull the base field toward a level. With the plateau profile and a distance in tiles for control, it makes a flat floor of a chosen width with steep walls climbing out of it.',
  whenToUse:
    'The node that turns a distance into terrain. Plateau plus subtract, fed by distance to threshold, is the canyon: a floor exactly as wide as you asked for and walls too steep to climb. Ramp plus add is a berm along a river bank, ring plus add is a crater rim or a reef, steps plus to level is a stair of terraces pinned to a smoothed height. The result is deliberately not clamped, so a cut can go below 0 and a rise above 1 — a combine fields left at clamp 1 downstream will silently flatten that away.',
  inputs: {
    base: { kind: 'field', expects: 'elevation', label: 'base', help: 'The field being shaped, usually the terrain the cut or the rise lands on.' },
    control: {
      kind: 'field',
      expects: 'distance',
      label: 'control',
      help: 'What the profile reads. For the plateau profile this must be a distance field, since the floor and wall widths are measured in tiles through the control range knob.',
    },
    level: {
      kind: 'field',
      expects: 'elevation',
      label: 'level',
      help: 'Optional height the "to level" operation pulls toward, read per cell. Leave it unwired to use the level value knob instead.',
      optional: true,
    },
  },
  params: {
    profile: {
      kind: 'choice',
      label: 'profile',
      help: 'How the control value becomes a strength between 0 and 1.',
      options: PROFILE_OPTIONS,
      default: PROFILE_PLATEAU,
    },
    op: {
      kind: 'choice',
      label: 'operation',
      help: 'What the shaped strength does to the base.',
      options: OPERATION_CHOICES,
      default: SHAPE_SUBTRACT,
    },
    amount: {
      kind: 'number',
      label: 'amount',
      help: 'How much the shape is worth in field units where the profile reads 1 — the depth of the cut or the height of the rise. For "to level" it is how far the pull goes, so 1 pins the floor exactly to the level.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.3,
    },
    center: {
      kind: 'number',
      label: 'centre',
      help: 'The control value the profile is built around. For a distance field this is the contour itself, which distance to threshold writes as 0.5.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    width: {
      kind: 'number',
      label: 'width',
      help: 'How much of the control range the profile spans, in control units rather than tiles. Ignored by the plateau profile, which measures in tiles.',
      min: 0.01,
      max: 1,
      step: 0.01,
      default: 0.4,
    },
    invert: {
      kind: 'toggle',
      label: 'invert',
      help: 'Flips the profile, so what was cut is left alone and what was left alone is cut.',
      default: 0,
    },
    levels: {
      kind: 'int',
      label: 'levels',
      help: 'How many flat levels the stair has, counting both ends.',
      min: 2,
      max: 16,
      default: 4,
      visibleWhen: { param: 'profile', equals: PROFILE_STEPS },
    },
    controlRange: {
      kind: 'int',
      label: 'control range',
      help: 'How many tiles the control field spends going from its contour to fully inside. Set it to the range knob of the distance to threshold feeding control, or the floor and wall widths below mean nothing.',
      min: 4,
      max: 128,
      default: 32,
      visibleWhen: { param: 'profile', equals: PROFILE_PLATEAU },
    },
    floorHalfWidth: {
      kind: 'int',
      label: 'floor half width',
      help: 'How many tiles either side of the contour stay at full strength. The floor of a canyon is twice this wide.',
      min: 0,
      max: 64,
      default: 4,
      visibleWhen: { param: 'profile', equals: PROFILE_PLATEAU },
    },
    wallWidth: {
      kind: 'int',
      label: 'wall width',
      help: 'How many tiles the wall takes to climb out of the floor. Small values give a cliff, large ones a valley.',
      min: 1,
      max: 64,
      default: 3,
      visibleWhen: { param: 'profile', equals: PROFILE_PLATEAU },
    },
    wallCurve: {
      kind: 'number',
      label: 'wall curve',
      help: 'Bends the wall. Below 1 it leaves the floor abruptly and eases into the rim; above 1 it lingers at the floor and then breaks sharply at the top.',
      min: 0.2,
      max: 4,
      step: 0.1,
      default: 1,
      visibleWhen: { param: 'profile', equals: PROFILE_PLATEAU },
    },
    levelValue: {
      kind: 'number',
      label: 'level value',
      help: 'The height "to level" pulls toward when no level field is wired.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4,
      visibleWhen: { param: 'op', equals: SHAPE_TO_LEVEL },
    },
  },
  output: 'field',
  outputSemantic: (params) => (params.op === SHAPE_ADD || params.op === SHAPE_SUBTRACT ? 'raw' : 'elevation'),
  generateChunk: shapeChunk,
});

function shapeChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const base = ctx.fieldInput('base');
  const control = ctx.fieldInput('control');
  if (!base || !control) return fieldValue(out);
  const level = ctx.fieldInput('level') ?? filledWith(ctx.params.levelValue as number);
  const strengthAt = strengthReader(ctx.params);
  const amount = ctx.params.amount as number;
  const op = ctx.params.op as number;
  for (let i = 0; i < out.length; i++) {
    out[i] = shaped(op, base[i]!, amount * strengthAt(control[i]!), level[i]!);
  }
  return fieldValue(out);
}

function shaped(op: number, base: number, shift: number, level: number): number {
  if (op === SHAPE_ADD) return base + shift;
  if (op === SHAPE_MAX) return Math.max(base, shift);
  if (op === SHAPE_MIN) return Math.min(base, shift);
  if (op === SHAPE_TO_LEVEL) return base + (level - base) * Math.max(0, Math.min(1, shift));
  return base - shift;
}

function strengthReader(params: Record<string, ParamValue>): (control: number) => number {
  if (params.profile === PROFILE_PLATEAU) {
    const plateau = plateauProfileOf(params);
    return (control) => plateauValueAt(control, plateau);
  }
  const profile = curveProfileOf(params);
  return (control) => profileValueAt(control, profile);
}

function curveProfileOf(params: Record<string, ParamValue>): FieldProfile {
  return {
    shape: params.profile as number,
    center: params.center as number,
    width: params.width as number,
    levels: params.levels as number,
    invert: params.invert === 1,
  };
}

function plateauProfileOf(params: Record<string, ParamValue>): PlateauProfile {
  return {
    center: params.center as number,
    tilesPerUnit: 2 * (params.controlRange as number),
    floorHalfWidth: params.floorHalfWidth as number,
    wallWidth: params.wallWidth as number,
    wallCurve: params.wallCurve as number,
    invert: params.invert === 1,
  };
}

function filledWith(value: number): Float32Array {
  return newFieldChunk().fill(value);
}
