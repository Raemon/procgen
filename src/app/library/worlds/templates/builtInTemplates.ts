import { sanitizeTemplates, type NodeTemplate } from './nodeTemplate';

let sanitized: NodeTemplate[] | null = null;

export function builtInTemplates(): NodeTemplate[] {
  sanitized ??= sanitizeTemplates(BUILT_IN_TEMPLATES);
  return sanitized;
}

const BUILT_IN_TEMPLATES = [
  {
    name: 'tectonic plates',
    description:
      'Drifting plates warped into believable outlines: ocean basins, continental platforms and uplift belts along the boundaries where plates converge. Self-contained — wire its last node into whatever shapes your terrain.',
    nodes: [
      {
        id: 't1',
        type: 'tectonicUplift',
        label: 'plates',
        comment: 'Basins, platforms and the belts where plates collide.',
        params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 't2',
        type: 'terrainNoise',
        label: 'warp x',
        comment: 'Displacement along east-west only.',
        params: { scale: 0.004, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 't3',
        type: 'terrainNoise',
        label: 'warp y',
        comment: 'Displacement along north-south only.',
        params: { scale: 0.0045, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 't4',
        type: 'domainWarp',
        label: 'warped plates',
        comment: 'Bends the straight plate bisectors into headlands, bays and islands.',
        params: { strength: 110 },
        inputs: { source: 't1', offsetX: 't2', offsetY: 't3' },
        display: { mode: 'hidden' },
      },
    ],
  },
  {
    name: 'mountain belts',
    description:
      'Sharp ridged relief confined to the high belts of an uplift field, leaving the lowlands smooth. Wire your uplift field into both unwired inputs.',
    nodes: [
      {
        id: 't1',
        type: 'hypsometricCurve',
        label: 'belt mask',
        comment: 'A steep curve pivoted above continental crust, so it reads as 1 inside a belt and 0 outside.',
        params: { seaLevel: 0.72, steepness: 25 },
        inputs: { source: null },
        display: { mode: 'hidden' },
      },
      {
        id: 't2',
        type: 'terrainNoise',
        label: 'ridges',
        comment: 'Folded octaves: sharp crests, steep flanks.',
        params: { scale: 0.01, style: 1, octaves: 7, lacunarity: 2.1, gain: 0.5 },
        inputs: {},
        display: { mode: 'hidden' },
      },
      {
        id: 't3',
        type: 'blendFields',
        label: 'ranges in the belts',
        comment: 'Ridges mixed in only where the belt mask allows.',
        params: { weight: 0.8 },
        inputs: { a: null, b: 't2', mask: 't1' },
        display: { mode: 'hidden' },
      },
    ],
  },
  {
    name: 'river valleys',
    description:
      'Rainfall routed downhill into a drainage network, the valleys it cuts, and the water itself. Wire terrain into the drainage node; the carved field is what everything downstream should use as elevation.',
    nodes: [
      {
        id: 't1',
        type: 'flowAccumulation',
        label: 'drainage',
        comment: 'Every cell drains; the count of what passes through is the river network.',
        params: { seaLevel: 0.5, catchmentScale: 3000, fillPits: 1, windowRadius: 40 },
        inputs: { elevation: null },
        display: { mode: 'hidden' },
      },
      {
        id: 't2',
        type: 'carveValleys',
        label: 'eroded terrain',
        comment: 'Channels cut in proportion to what they carry, so rivers sit in valleys.',
        params: { depth: 0.08, minFlow: 0.4, valleyWidth: 6 },
        inputs: { elevation: null, flow: 't1' },
        display: { mode: 'elevation', heightScale: 8 },
      },
      {
        id: 't3',
        type: 'riverFromFlow',
        label: 'rivers',
        comment: 'Threads upstream, trunks downstream, widening toward the mouth.',
        params: { minFlow: 0.55, maxWidth: 5, seaLevel: 0.5, riverTile: 0 },
        inputs: { flow: 't1', elevation: 't2' },
        display: { mode: 'tileLayer' },
      },
    ],
  },
  {
    name: 'coastline',
    description:
      'Distance to the shoreline, plus the near-binary land mask cut from it. Wire terrain into the distance node; use the mask to keep layers off the water.',
    nodes: [
      {
        id: 't1',
        type: 'coastDistance',
        label: 'coast distance',
        comment: '0 far offshore, 0.5 on the shoreline, 1 deep inland.',
        params: { seaLevel: 0.5, range: 32 },
        inputs: { elevation: null },
        display: { mode: 'hidden' },
      },
      {
        id: 't2',
        type: 'hypsometricCurve',
        label: 'land mask',
        comment: 'The same curve used as a switch: 0 at sea, 1 once you are a few tiles inland.',
        params: { seaLevel: 0.57, steepness: 30 },
        inputs: { source: 't1' },
        display: { mode: 'hidden' },
      },
    ],
  },
  {
    name: 'temperate biome',
    description:
      'A whole biome on two cards: steepness, then one biome node banding terrain into sea, shore, ground, rock and snow. Wire terrain into both, and a region mask if you are stacking biomes.',
    nodes: [
      {
        id: 't1',
        type: 'slopeField',
        label: 'steepness',
        comment: 'Rock is a question about steepness, not height.',
        params: { radius: 3, gain: 12 },
        inputs: { source: null },
        display: { mode: 'hidden' },
      },
      {
        id: 't2',
        type: 'biomeBands',
        label: 'temperate',
        comment: 'The knobs you actually retune for this biome, on one card.',
        params: {
          seaLevel: 0.5,
          deepDrop: 0.06,
          shoreBand: 0.06,
          rockAbove: 0.45,
          snowLine: 0.85,
          regionAtLeast: 0.5,
          deepTile: 5,
          waterTile: 0,
          shoreTile: 1,
          groundTile: 2,
          rockTile: 4,
          snowTile: 7,
        },
        inputs: { elevation: null, steepness: 't1', shoreDistance: null, region: null },
        display: { mode: 'tileLayer' },
      },
    ],
  },
];
