import type { ExamplePipeline } from './examplePipeline';

export function settlementsAndWildlife(): ExamplePipeline {
  return {
    name: 'settlements & wildlife',
    description:
      'Island terrain with the assets on top: cottages and watchtowers stamped as pieces, deer and wolves spawned as creatures.',
    state: {
      seed: 4242,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'height noise',
          comment:
            'The same single-field terrain as the islands example — everything below reads it, so villages and herds land where the ground suits them.',
          enabled: true,
          params: { scale: 0.05, octaves: 5 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 3 },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'ocean & sand',
          comment: 'The base coat: water below 0.45, sand above, so every cell starts painted.',
          enabled: true,
          params: { threshold: 0.45, belowTile: 0, aboveTile: 1 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'thresholdTiles',
          label: 'grassland',
          comment: 'Grass only above 0.52, leaving the coast as sand for the pieces to sit behind.',
          enabled: true,
          params: { threshold: 0.52, belowTile: -1, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'thresholdTiles',
          label: 'peaks',
          comment: 'Rock above 0.68 — the band the watchtowers below are masked to.',
          enabled: true,
          params: { threshold: 0.68, belowTile: -1, aboveTile: 4 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n5',
          type: 'scatterPoints',
          label: 'cottages',
          comment:
            'Sparse points on gentle grassland, each stamping the cottage piece. Random rotation is hashed from the point, so the village varies but never changes between reloads.',
          enabled: true,
          params: { density: 0.004, maskAtLeast: 0.55, maskAtMost: 0.64 },
          inputs: { mask: 'n1' },
          display: { mode: 'pieces', pieceId: 0, rotation: -1 },
        },
        {
          id: 'n6',
          type: 'scatterPoints',
          label: 'watchtowers',
          comment: 'Rarer, and only up on the high ground, so towers read as landmarks.',
          enabled: true,
          params: { density: 0.0015, maskAtLeast: 0.68, maskAtMost: 1 },
          inputs: { mask: 'n1' },
          display: { mode: 'pieces', pieceId: 1, rotation: 0 },
        },
        {
          id: 'n7',
          type: 'scatterPoints',
          label: 'deer',
          comment:
            'Spawn cells, not positions: each point near the player becomes one wandering deer that roams around this cell.',
          enabled: true,
          params: { density: 0.01, maskAtLeast: 0.54, maskAtMost: 0.66 },
          inputs: { mask: 'n1' },
          display: { mode: 'creatures', creatureId: 0 },
        },
        {
          id: 'n8',
          type: 'scatterPoints',
          label: 'wolves',
          comment: 'Sparser and hunting: wolves chase the player once they are in sight.',
          enabled: true,
          params: { density: 0.002, maskAtLeast: 0.56, maskAtMost: 0.7 },
          inputs: { mask: 'n1' },
          display: { mode: 'creatures', creatureId: 2 },
        },
      ],
    },
  };
}
