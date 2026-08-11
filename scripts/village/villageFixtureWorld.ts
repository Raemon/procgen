import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { THATCHMERE_CULTURE_ID } from '@/features/asset-library/cultures/defaultCultures';

export function villageFixtureState(): PipelineState {
  return sanitizePipeline({
    seed: 4181,
    daylight: 1,
    nodes: [
      groundNode(),
      habitabilityNode(),
      travelNode(),
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

function travelNode() {
  return {
    id: 'travel',
    type: 'travelCostField',
    label: 'what it costs to cross',
    folder: 'the people',
    enabled: true,
    params: { seaLevel: 0.2 },
    inputs: { elevation: 'ground' },
    display: { mode: 'hidden' },
  };
}

function centersNode() {
  return {
    id: 'centers',
    type: 'settlementSpread',
    label: 'village centers',
    folder: 'the people',
    enabled: true,
    params: { landfallPitch: 512, spacing: 96, minScore: 0.2, spreadSpeed: 3 },
    inputs: { habitability: 'habitability', travelCost: 'travel' },
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
