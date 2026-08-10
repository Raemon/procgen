import { defaultTileId } from '../../assets/tiles/defaultTiles';
import { BLOCKING_TILE_HEIGHT } from '../../assets/tiles/tileHeight';
import type { ExamplePipeline } from './examplePipeline';

const ROOF_ON_THE_WALLS = BLOCKING_TILE_HEIGHT;
const TORCH_ITEM = 5;
const ASH_HOUND = 4;

export function infiniteLabyrinth(): ExamplePipeline {
  return {
    name: 'infinite labyrinth',
    description:
      'One node is the whole dungeon: every 32-tile chunk is either a big walled room holding a single puzzle or a dense warren, and every chunk opens onto its neighbours through one to four doorways. The doors spiral — the ways outward from each ring are gathered into one quarter of it, turned a golden angle from the ring before, with one seam of the ring sealed shut — so moving outward means winding around each ring rather than walking straight. You wake in the empty room at the origin with a torch beside you; the first rings are all rooms of escalating challenge, and beyond them a quarter of the chunks give way to warrens you can wander freely. Something lives down here too: about one chunk in twenty beyond the fourth ring keeps an ash hound. Press F to work a lever or take a key, walk into a crate to push it, and R to reset a room you have wedged shut.',
    state: {
      seed: 5309,
      daylight: 0,
      nodes: [
        {
          id: 'n1',
          type: 'labyrinthChunks',
          label: 'the labyrinth',
          folder: 'the dungeon',
          comment:
            'The whole world in one node: chunk-sized rooms and warrens joined by spiralling doors. Three tutorial rings keep the opening all rooms, and the room share of 0.75 mixes warrens in beyond them. The puzzle layer reads this same node to furnish each room, so which levers, keys and crates you meet is decided here too.',
          enabled: true,
          params: {
            roomFraction: 0.75,
            tutorialRings: 3,
            corridor: 1,
            wall: 1,
            braid: 0.15,
            carver: 0,
            doorJitter: 0.5,
            wallTile: defaultTileId('dressed granite wall'),
            floorTile: defaultTileId('cobbled street'),
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'denizens',
          type: 'labyrinthDenizens',
          label: 'what lives down here',
          folder: 'the dungeon',
          comment:
            'Roughly one chunk in twenty beyond the fourth ring is home to an ash hound, standing somewhere on that room or warren floor. The knobs here mirror the labyrinth node above so the hounds stand on its floors and not in its walls; the first four rings stay empty, because the opening is for learning in.',
          enabled: true,
          params: {
            roomFraction: 0.75,
            tutorialRings: 3,
            corridor: 1,
            wall: 1,
            braid: 0.15,
            carver: 0,
            doorJitter: 0.5,
            rarity: 0.05,
            safeRings: 4,
          },
          inputs: {},
          display: { mode: 'creatures', creatureId: ASH_HOUND },
        },
        {
          id: 'n2',
          type: 'landmarkPoint',
          label: 'torch',
          folder: 'where you wake up',
          comment:
            'One point, a few tiles into the spawn room, bound to the torch item. With daylight at 0 and a roof over everything this torch is the only thing that makes the labyrinth visible: walk over it and the character carries its light with her.',
          enabled: true,
          params: { x: 3, y: 3 },
          inputs: {},
          display: { mode: 'items', itemId: TORCH_ITEM },
        },
        {
          id: 'n3',
          type: 'constantField',
          label: 'everywhere',
          folder: 'the roof',
          comment:
            'A flat 1 over every cell — the simplest way to say "all of it" to the threshold below, which is what makes the roof cover the whole labyrinth rather than patches of it.',
          enabled: true,
          params: { value: 1 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n4',
          type: 'thresholdTiles',
          label: 'rock roof',
          folder: 'the roof',
          comment:
            'Every cell is above the threshold, so every cell gets rock, and the ceiling display hangs it exactly where the stone walls end so the roof sits on the walls. Ceilings only draw in first person, so the god camera can still look down into the labyrinth.',
          enabled: true,
          params: { threshold: 0.5, belowTile: -1, aboveTile: defaultTileId('granite outcrop') },
          inputs: { source: 'n3' },
          display: { mode: 'ceiling', height: ROOF_ON_THE_WALLS },
        },
      ],
    },
  };
}
