import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { lairInChunk } from '../../labyrinth/denizenLairs';
import { LABYRINTH_SEED_LABEL, labyrinthKnobsFrom } from '../../labyrinth/labyrinthKnobs';
import { LABYRINTH_GEOMETRY_PARAMS } from './labyrinthGeometryParams';

export const DENIZEN_TAG = 'denizen';

registerNodeType({
  type: 'labyrinthDenizens',
  title: 'labyrinth denizens',
  category: 'maze',
  description:
    'One rare inhabitant per haunted chunk, standing on a floor cell of the room or warren the labyrinth carved there. Rings near the origin are left empty so the opening stays a place to learn in.',
  whenToUse:
    'The thing you did not want to meet, in a world made of rooms. Give it the same geometry knobs as the labyrinth node beside it and bind it to a creature, so the delve has something living in it as well as puzzles.',
  inputs: {},
  params: {
    ...LABYRINTH_GEOMETRY_PARAMS,
    rarity: {
      kind: 'number',
      label: 'rarity',
      help: 'Chance that any one chunk beyond the safe rings is home to something. 0.05 makes an encounter roughly every twenty rooms.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.05,
    },
    safeRings: {
      kind: 'int',
      label: 'safe rings',
      help: 'Rings of chunks around the origin left empty, so nothing is met before the puzzle kinds have been taught.',
      min: 0,
      max: 12,
      default: 4,
    },
  },
  output: 'points',
  generateChunk: denizenChunk,
});

function denizenChunk(ctx: ChunkGenCtx): ChunkValue {
  const knobs = labyrinthKnobsFrom(ctx.hashSeed(LABYRINTH_SEED_LABEL), ctx.params);
  const lair = lairInChunk(ctx.chunkX, ctx.chunkY, knobs, denizenKnobsOf(ctx));
  const points: PointsChunk = lair ? [{ x: lair.x, y: lair.y, tag: DENIZEN_TAG }] : [];
  return pointsValue(points);
}

function denizenKnobsOf(ctx: ChunkGenCtx) {
  return {
    rarity: ctx.params.rarity as number,
    safeRings: ctx.params.safeRings as number,
  };
}
