import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

const CONTOUR_BANDS_SCRIPT = `const height = ctx.fieldInput('a');
const tiles = ctx.newTiles();
if (!height) return tiles;
const bands = [0, 1, 2, 4];
for (let i = 0; i < tiles.length; i++) {
  const band = Math.min(bands.length - 1, Math.floor(height[i] * bands.length));
  tiles[i] = bands[band];
}
return tiles;`;

export function scriptedContourState(): PipelineState {
  return sanitizePipeline({
    seed: 77,
    nodes: [
      {
        id: 'n1',
        type: 'noiseField',
        label: 'height noise',
        enabled: true,
        params: { scale: 0.05, octaves: 4 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 'n2',
        type: 'customScript',
        label: 'contour bands',
        enabled: true,
        params: { outputKind: 'tiles', code: CONTOUR_BANDS_SCRIPT },
        inputs: { a: 'n1' },
        display: { mode: 'tileLayer' },
      },
    ],
  });
}

export function monsterCavesState(): PipelineState {
  return sanitizePipeline({
    seed: 90210,
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
        label: 'rock & floor',
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
        params: { density: 0.012, maskAtLeast: 0, maskAtMost: 0.45 },
        inputs: { mask: 'n1' },
        display: { mode: 'markers', tileId: -1, glyph: 'M', color: '#ff4444' },
      },
    ],
  });
}
