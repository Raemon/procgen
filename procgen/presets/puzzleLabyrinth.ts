import { BLOCKING_TILE_HEIGHT } from '../../assets/tiles/tileHeight';
import type { ExamplePipeline } from './examplePipeline';

const ROOF_ON_THE_WALLS = BLOCKING_TILE_HEIGHT;
const GRAVEL = 9;
const COBBLESTONE = 15;
const STONE_WALL = 17;
const ROCK = 4;
const TORCH_ITEM = 5;

export function puzzleLabyrinth(): ExamplePipeline {
  return {
    name: 'puzzle labyrinth',
    description:
      'A lightless delve you open rather than walk. Nine-tile chambers sit twenty-one tiles apart, close enough that the corridor between two of them is a few paces rather than a trek, and the ten-tile band left over is packed with a fine two-tile-pitch warren you can wander freely and never use to get around a door. Every doorway is locked until one of the two chambers it joins has been solved. You wake in the empty chamber at the origin with a torch at your feet; the chambers around you are levers, the ring beyond that keys, the ring beyond that crates and pressure plates, and everything further out mixes the three. Press F to work a lever or take a key, walk into a crate to push it, and R to reset a chamber you have wedged shut.',
    state: {
      seed: 8721,
      daylight: 0,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'warren',
          folder: 'the delve',
          comment:
            'The rock the chambers are cut into, carved down to its finest pitch: one-tile corridors between one-tile walls, so the space left between chambers reads as a dense warren rather than empty rock. It only shows where the puzzle layer above leaves a cell empty, which is exactly the band between the chambers. Wandering it never bypasses a door, because a chamber keeps its wall ring whatever lies outside it and both mouths of every corridor are doored.',
          enabled: true,
          params: {
            corridor: 1,
            wall: 1,
            mazeChunks: 1,
            carver: 0,
            braid: 0.15,
            doorsPerEdge: 2,
            rooms: 0.1,
            roomCells: 2,
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
            'Nine-tile chambers on a twenty-one-tile lattice, so a chamber plus its wall ring leaves ten tiles of warren between neighbours and the corridors are short enough to see the far door from the near one. Every corridor is doored at both mouths, so opening onto the warren costs the chambers nothing. "Solid between rooms" is off so that warren shows through. Which puzzle furnishes a chamber comes from how far it is from the origin, so the first chamber anyone meets is one lever in the middle of an empty room whichever way they walk out of the spawn.',
          enabled: true,
          params: {
            roomTiles: 9,
            roomSpacing: 21,
            regionRooms: 5,
            carver: 0,
            braid: 0.25,
            doorsPerEdge: 1,
            wall: 1,
            corridor: 1,
            fillBetween: 0,
            floorTile: COBBLESTONE,
            wallTile: STONE_WALL,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'landmarkPoint',
          label: 'torch',
          folder: 'where you wake up',
          comment:
            'One point, two tiles east of the spawn, bound to the torch item. With daylight at 0 and a roof over everything, this torch is the only thing that makes the delve visible: walk over it and the character carries its light with her.',
          enabled: true,
          params: { x: 2, y: 0 },
          inputs: {},
          display: { mode: 'items', itemId: TORCH_ITEM },
        },
        {
          id: 'n4',
          type: 'constantField',
          label: 'everywhere',
          folder: 'the roof',
          comment:
            'A flat 1 over every cell — the simplest way to say "all of it" to the threshold below, which is what makes the roof cover the whole delve rather than patches of it.',
          enabled: true,
          params: { value: 1 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n5',
          type: 'thresholdTiles',
          label: 'rock roof',
          folder: 'the roof',
          comment:
            'Every cell is above the threshold, so every cell gets rock, and the ceiling display hangs it 2 tiles up, which is exactly where the stone walls end: any higher and the roof floats over a gap the walls never reach, which reads as no roof at all. Ceilings only draw in first person, so the god camera can still look down into the delve.',
          enabled: true,
          params: { threshold: 0.5, belowTile: -1, aboveTile: ROCK },
          inputs: { source: 'n4' },
          display: { mode: 'ceiling', height: ROOF_ON_THE_WALLS },
        },
      ],
    },
  };
}
