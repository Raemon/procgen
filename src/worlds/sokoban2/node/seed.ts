import { defaultTileId } from '@/features/asset-library/tiles/defaultTiles'
import type { ExamplePipeline } from '@/features/asset-library/worlds/seeds/examplePipeline'
import { GEN_PARAMS } from '../benchConfig'
import { SOKOBAN2_HEIGHTS_NODE_TYPE, SOKOBAN2_NODE_TYPE } from './dungeonKnobs'

export const SOKOBAN_DUNGEON_SEED_NAME = 'sokoban dungeon'

export function sokobanDungeon(): ExamplePipeline {
  return {
    name: SOKOBAN_DUNGEON_SEED_NAME,
    description:
      'A finite maze of twenty-five room slots, every room a crate-pushing puzzle proven solvable before it ships. Walk into a crate to push it along level floor; a crate standing taller than you is something to jump onto, and from its top you can jump up onto a ledge. Each door waits on the room in front of it: finish that room by settling a crate of the right colour on every goal and the door swings open, and once open it stays open. Some rooms want a crate delivered from a neighbour, so a spare is parked by the door with its lane kept clear. Press R to leave the whole maze behind and grow a fresh one from a new seed. The whole maze is built on the server in a few seconds before anyone can enter.',
    state: {
      seed: 4711,
      daylight: 1,
      nodes: [
        {
          id: 'dungeon',
          type: SOKOBAN2_NODE_TYPE,
          label: 'the dungeon',
          folder: 'the dungeon',
          comment:
            'The whole maze in one node, built whole on the server: 5x5 slots gathered into rooms of up to two slots, a spanning tree of doors with a few loops, and a curriculum of crate puzzles that gets harder with depth. Pale pavers are floor, amber lipped blocks the two-high ledges, dark slate the walls, so the three read apart at a glance from overhead. The rules layer reads this same node to stand the crates, goals and doors in the world.',
          enabled: true,
          params: {
            ...GEN_PARAMS,
            floorTile: defaultTileId('dungeon floor'),
            ledgeTile: defaultTileId('dungeon ledge'),
            wallTile: defaultTileId('dungeon wall'),
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'heights',
          type: SOKOBAN2_HEIGHTS_NODE_TYPE,
          label: 'ledges and walls',
          folder: 'the ground',
          comment:
            'Reads the dungeon above and raises ledges and walls two units, bound to elevation at scale 1. A crate is one unit tall, so a ledge is exactly one jump up from the top of a crate and never reachable straight from the floor.',
          enabled: true,
          params: {},
          inputs: { dungeon: 'dungeon' },
          display: { mode: 'elevation', heightScale: 1 },
        },
      ],
    },
  }
}
