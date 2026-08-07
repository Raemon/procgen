import type { ExamplePipeline } from './examplePipeline';

const GRAVEL = 9;
const COBBLESTONE = 15;
const STONE_WALL = 17;
const ROCK = 4;
const LAVA = 21;
const TORCH_ITEM = 5;

export function undergroundLabyrinth(): ExamplePipeline {
  return {
    name: 'underground labyrinth',
    description:
      'A roofed labyrinth of passages and chambers with no sky at all: daylight is 0, so the only things you can see are the lava seams that glow, and whatever light you carry. A torch waits in the seed chamber you start in — walk onto it and press G to pick it up.',
    state: {
      seed: 3106,
      daylight: 0,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'labyrinth',
          folder: 'the delve',
          comment:
            'The delve itself: one maze spanning 2x2 chunks so corridors run further than a single chunk, and the rooms knob turned up so a third of the lattice opens into chambers instead of pure corridor. Two doors per edge plus braiding keep loops in it, which matters far more when you can only see as far as your torch.',
          enabled: true,
          params: {
            corridor: 3,
            wall: 2,
            mazeChunks: 2,
            carver: 0,
            braid: 0.25,
            doorsPerEdge: 2,
            rooms: 0.35,
            roomCells: 4,
            wallTile: STONE_WALL,
            floorTile: GRAVEL,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n2',
          type: 'noiseField',
          label: 'heat',
          folder: 'the delve',
          comment:
            'Hidden plumbing for the lava below: a field whose rare high patches decide where the rock is still molten.',
          enabled: true,
          params: { scale: 0.09, octaves: 3 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n3',
          type: 'thresholdTiles',
          label: 'lava seams',
          folder: 'the delve',
          comment:
            'The only thing in this world that lights itself: lava only above 0.86, so it is rare, and everything below is left empty so the labyrinth shows through. Lava is the tile that carries a light radius, which is why these seams read as orange pools in the dark.',
          enabled: true,
          params: { threshold: 0.86, belowTile: -1, aboveTile: LAVA },
          inputs: { source: 'n2' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'landmarkRoom',
          label: 'seed chamber',
          folder: 'where you wake up',
          comment:
            'Stamped last of the floor layers so nothing overwrites it: a guaranteed 13x13 cobbled chamber at the origin, where the player spawns. No wall ring, so wherever the labyrinth already ran a corridor into this square it stays open and you can walk out.',
          enabled: true,
          params: {
            x: 0,
            y: 0,
            width: 13,
            height: 13,
            wallThickness: 0,
            floorTile: COBBLESTONE,
            wallTile: STONE_WALL,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n5',
          type: 'landmarkPoint',
          label: 'torch',
          folder: 'where you wake up',
          comment:
            'One point, two tiles east of the spawn, bound to the torch item. The torch is what makes the rest of the world visible: pick it up and the character carries its light with her.',
          enabled: true,
          params: { x: 2, y: 0 },
          inputs: {},
          display: { mode: 'items', itemId: TORCH_ITEM },
        },
        {
          id: 'n6',
          type: 'constantField',
          label: 'everywhere',
          folder: 'the roof',
          comment:
            'A flat 1 over every cell — the simplest way to say "all of it" to the threshold below, which is what makes the roof cover the whole world rather than patches of it.',
          enabled: true,
          params: { value: 1 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n7',
          type: 'thresholdTiles',
          label: 'rock roof',
          folder: 'the roof',
          comment:
            'Every cell is above the threshold, so every cell gets rock, and the ceiling display hangs it 4 tiles up — head height plus room for a torch. Ceilings only draw in first person, so the god camera can still look down into the delve.',
          enabled: true,
          params: { threshold: 0.5, belowTile: -1, aboveTile: ROCK },
          inputs: { source: 'n6' },
          display: { mode: 'ceiling', height: 4 },
        },
      ],
    },
  };
}
