export interface ExamplePipeline {
  name: string;
  state: unknown;
}

export function examplePipelines(): ExamplePipeline[] {
  return [islandsAndForests(), cavesAndMonsters(), customScriptDemo(), endlessLabyrinth()];
}

function islandsAndForests(): ExamplePipeline {
  return {
    name: 'islands & forests',
    state: {
      seed: 1234,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'height noise',
          enabled: true,
          params: { scale: 0.05, octaves: 5 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 3 },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'ocean & sand',
          enabled: true,
          params: { threshold: 0.45, belowTile: 0, aboveTile: 1 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'thresholdTiles',
          label: 'grassland',
          enabled: true,
          params: { threshold: 0.52, belowTile: -1, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'thresholdTiles',
          label: 'peaks',
          enabled: true,
          params: { threshold: 0.68, belowTile: -1, aboveTile: 4 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n5',
          type: 'scatterPoints',
          label: 'trees',
          enabled: true,
          params: { density: 0.08, maskAtLeast: 0.54, maskAtMost: 0.66, tag: 'tree' },
          inputs: { mask: 'n1' },
          display: { mode: 'markers', tileId: 3, glyph: '♠', color: '#2d6a34' },
        },
      ],
    },
  };
}

function cavesAndMonsters(): ExamplePipeline {
  return {
    name: 'caves & monsters',
    state: {
      seed: 99,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'cave noise',
          enabled: true,
          params: { scale: 0.09, octaves: 5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'floor & walls',
          enabled: true,
          params: { threshold: 0.52, belowTile: 1, aboveTile: 4 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'scatterPoints',
          label: 'monsters',
          enabled: true,
          params: { density: 0.012, maskAtLeast: 0, maskAtMost: 0.45, tag: 'monster' },
          inputs: { mask: 'n1' },
          display: { mode: 'markers', tileId: -1, glyph: 'M', color: '#ff4444' },
        },
      ],
    },
  };
}

function customScriptDemo(): ExamplePipeline {
  return {
    name: 'custom script demo',
    state: {
      seed: 7,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'base noise',
          enabled: true,
          params: { scale: 0.04, octaves: 4 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 2.5 },
        },
        {
          id: 'n2',
          type: 'customScript',
          label: 'script: contour bands',
          enabled: true,
          params: { outputKind: 'tiles', code: CONTOUR_BANDS_SCRIPT },
          inputs: { a: 'n1' },
          display: { mode: 'tileLayer' },
        },
      ],
    },
  };
}

function endlessLabyrinth(): ExamplePipeline {
  return {
    name: 'endless labyrinth',
    state: {
      seed: 41,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'labyrinth',
          enabled: true,
          params: {
            lattice: 'classic',
            carver: 'dfs',
            braid: 0.15,
            doorsPerEdge: 1,
            wallTile: 4,
            floorTile: 1,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
      ],
    },
  };
}

const CONTOUR_BANDS_SCRIPT = `const height = ctx.fieldInput('a');
const tiles = ctx.newTiles();
if (!height) return tiles;
const bands = [0, 1, 2, 4];
for (let i = 0; i < tiles.length; i++) {
  const band = Math.min(bands.length - 1, Math.floor(height[i] * bands.length));
  tiles[i] = bands[band];
}
return tiles;`;
