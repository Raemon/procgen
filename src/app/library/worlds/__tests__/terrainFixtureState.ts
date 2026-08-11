import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

export const BAND_FOLDER = 'biome bands';
export const SLOPE_FOLDER = 'steep ground';

export function noiseTerrainState(): PipelineState {
  return sanitizePipeline({
    seed: 1234,
    nodes: [
      heightNoise(),
      thresholdLayer('n2', 'ocean & sand', 0.45, 0, 1),
      thresholdLayer('n3', 'grassland', 0.52, -1, 2),
      thresholdLayer('n4', 'peaks', 0.68, -1, 4),
      slopeOfHeight(),
      steepGround(),
      treeScatter(),
    ],
  });
}

function heightNoise() {
  return {
    id: 'n1',
    type: 'noiseField',
    label: 'height noise',
    enabled: true,
    params: { scale: 0.05, octaves: 5 },
    inputs: {},
    display: { mode: 'elevation', heightScale: 3 },
  };
}

function thresholdLayer(
  id: string,
  label: string,
  threshold: number,
  belowTile: number,
  aboveTile: number,
) {
  return {
    id,
    type: 'thresholdTiles',
    label,
    folder: BAND_FOLDER,
    comment: 'One band of the stacked biome thresholds this fixture paints.',
    enabled: true,
    params: { threshold, belowTile, aboveTile },
    inputs: { source: 'n1' },
    display: { mode: 'tileLayer' },
  };
}

function slopeOfHeight() {
  return {
    id: 'n6',
    type: 'slopeField',
    label: 'slope',
    folder: SLOPE_FOLDER,
    comment: 'Reads the height noise from outside this folder, so a captured group opens that wire.',
    enabled: true,
    params: { radius: 2 },
    inputs: { source: 'n1' },
    display: { mode: 'hidden' },
  };
}

function steepGround() {
  return {
    id: 'n7',
    type: 'thresholdTiles',
    label: 'scree',
    folder: SLOPE_FOLDER,
    comment: 'Reads the slope beside it, so a captured group keeps that wire intact.',
    enabled: true,
    params: { threshold: 0.2, belowTile: -1, aboveTile: 4 },
    inputs: { source: 'n6' },
    display: { mode: 'tileLayer' },
  };
}

function treeScatter() {
  return {
    id: 'n5',
    type: 'scatterPoints',
    label: 'trees',
    enabled: true,
    params: { density: 0.08, maskAtLeast: 0.54, maskAtMost: 0.66 },
    inputs: { mask: 'n1' },
    display: { mode: 'markers', tileId: 3, glyph: '♠', color: '#2d6a34' },
  };
}
