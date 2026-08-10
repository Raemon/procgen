import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../../procgen/pipeline/pipelineState';
import { THATCHMERE_CULTURE_ID } from '../../assets/cultures/defaultCultures';

export function villageFixtureState(): PipelineState {
  return sanitizePipeline({
    seed: 4181,
    daylight: 1,
    nodes: [
      groundNode(),
      habitabilityNode(),
      centersNode(),
      streetsNode(),
      plotsNode(),
    ],
  });
}

function groundNode() {
  return {
    id: 'ground',
    type: 'constantField',
    label: 'level ground',
    folder: 'the vale',
    enabled: true,
    params: { value: 0.62 },
    inputs: {},
    display: { mode: 'hidden' },
  };
}

function habitabilityNode() {
  return {
    id: 'habitability',
    type: 'noiseField',
    label: 'habitability',
    folder: 'the vale',
    enabled: true,
    params: { scale: 0.01, octaves: 3, gain: 0.5, lacunarity: 2 },
    inputs: {},
    display: { mode: 'hidden' },
  };
}

function centersNode() {
  return {
    id: 'centers',
    type: 'villageCenters',
    label: 'village centers',
    folder: 'the people',
    enabled: true,
    params: { maskAtLeast: 0.4, maskAtMost: 0.95, spacing: 96 },
    inputs: { mask: 'habitability' },
    display: { mode: 'markers', tileId: -1, glyph: '*', color: '#ffcc55' },
  };
}

function streetsNode() {
  return {
    id: 'streets',
    type: 'villageStreets',
    label: 'streets',
    folder: 'the people',
    enabled: true,
    params: { radius: 48, plotCells: 16 },
    inputs: { centers: 'centers' },
    display: { mode: 'tileLayer' },
  };
}

function plotsNode() {
  return {
    id: 'plots',
    type: 'villagePlots',
    label: 'houses',
    folder: 'the people',
    enabled: true,
    params: { radius: 48, plotCells: 16 },
    inputs: { centers: 'centers' },
    display: { mode: 'structures', cultureId: THATCHMERE_CULTURE_ID },
  };
}
