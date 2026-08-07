import type { ExamplePipeline } from './examplePipeline';

const GRAVEL = 9;
const COBBLESTONE = 15;
const STONE_WALL = 17;

export function puzzleLabyrinth(): ExamplePipeline {
  return {
    name: 'puzzle labyrinth',
    description:
      'A labyrinth you open rather than walk. Every chamber holds one puzzle and its two doors stay locked until that puzzle is done, so the only way outward is through. You wake in the empty chamber at the origin; the ring of chambers around it is levers, the ring beyond that keys, the ring beyond that crates and pressure plates, and everything further out mixes the three and keeps adding pieces. Press F to work a lever or take a key, walk into a crate to push it, and R to reset a chamber you have wedged shut.',
    state: {
      seed: 8721,
      daylight: 1,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'rough delve',
          folder: 'the delve',
          comment:
            'The rock the chambers are cut into. It only shows through where the puzzle layer above leaves a cell empty, which with "solid between rooms" on is nowhere — turn that knob off and this labyrinth reappears around the chambers, which is the interesting variant once the puzzles read clearly on their own.',
          enabled: true,
          params: {
            corridor: 3,
            wall: 1,
            mazeChunks: 2,
            carver: 0,
            braid: 0.25,
            doorsPerEdge: 2,
            rooms: 0.3,
            roomCells: 3,
            wallTile: STONE_WALL,
            floorTile: GRAVEL,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n2',
          type: 'puzzleRooms',
          label: 'puzzle chambers',
          folder: 'the delve',
          comment:
            'One 13-tile chamber per chunk, joined east and south by single-tile corridors, with a doorway punched at each corridor mouth. Which puzzle furnishes a chamber comes from how far it is from the origin, so the first ring anyone meets is one lever in the middle of an empty room whichever way they walk out of the spawn.',
          enabled: true,
          params: {
            roomTiles: 13,
            roomChunks: 1,
            wall: 1,
            corridor: 1,
            fillBetween: 1,
            floorTile: COBBLESTONE,
            wallTile: STONE_WALL,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
      ],
    },
  };
}
