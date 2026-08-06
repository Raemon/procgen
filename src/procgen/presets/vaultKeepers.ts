import type { ExamplePipeline } from './examplePipeline';

export function vaultKeepers(): ExamplePipeline {
  return {
    name: 'vault keepers',
    description:
      'The quest layer in one preset: walled vaults on an endless lattice, each door locked until you take its key — resting on the grass as a marker, and carried by a skittish keeper you can corner instead. Sentries guard the doors; treasure waits inside.',
    state: {
      seed: 2026,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'meadow noise',
          comment:
            'Only decoration: drives the flower patches so the plain between vaults is not a flat sheet of grass.',
          enabled: true,
          params: { scale: 0.06, octaves: 4 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'grass plain',
          comment:
            'Base coat painting every cell grass, so keys are always reachable — the walls node is the only thing that blocks walking.',
          enabled: true,
          params: { threshold: 0, belowTile: 2, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'thresholdTiles',
          label: 'flower patches',
          comment: 'Meadow texture over the grass; below the cut is (empty) so grass shows through.',
          enabled: true,
          params: { threshold: 0.62, belowTile: -1, aboveTile: 12 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'vaultWalls',
          label: 'vaults',
          comment:
            'One walled vault per 96-tile district: stone ring, flagstone floor, and a wood-plank door cell. The planks are walkable — the door point below is what locks them.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, wallTile: 17, floorTile: 16, doorTile: 19 },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n5',
          type: 'vaultPoints',
          label: 'vault doors',
          comment:
            'The lock: a door:<district> point on each door cell keeps it impassable until the matching key is held. Same span and size as the walls, so the point lands exactly on the planks.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, emit: 0 },
          inputs: {},
          display: { mode: 'markers', tileId: -1, glyph: '+', color: '#e0a03a' },
        },
        {
          id: 'n6',
          type: 'vaultPoints',
          label: 'vault keys',
          comment:
            'The key at rest: a key:<district> point somewhere in the district outside the walls. Stepping onto it takes the key; the marker doubles as the keeper\'s nest.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, emit: 1 },
          inputs: {},
          display: { mode: 'markers', tileId: -1, glyph: '⚷', color: '#ffd75e' },
        },
        {
          id: 'n7',
          type: 'vaultPoints',
          label: 'keepers',
          comment:
            'The same key points displayed as creatures: each spawns a keeper that flees when you come close. Corner it and touch it and the key is yours — the animated alternative to raiding its nest.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, emit: 1 },
          inputs: {},
          display: { mode: 'creatures', creatureId: 4 },
        },
        {
          id: 'n8',
          type: 'vaultPoints',
          label: 'door sentries',
          comment:
            'The same door points displayed as creatures: a sentry guarding each doorstep, chasing you off before walking back.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, emit: 0 },
          inputs: {},
          display: { mode: 'creatures', creatureId: 3 },
        },
        {
          id: 'n9',
          type: 'vaultPoints',
          label: 'treasure',
          comment: 'The prize at each vault center — the reason to want the door open.',
          enabled: true,
          params: { districtSpan: 96, vaultSize: 11, emit: 2 },
          inputs: {},
          display: { mode: 'markers', tileId: -1, glyph: '$', color: '#ffd75e' },
        },
      ],
    },
  };
}
