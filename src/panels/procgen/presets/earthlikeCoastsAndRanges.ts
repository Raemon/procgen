import type { ExamplePipeline } from './examplePipeline';

export function earthlikeCoastsAndRanges(): ExamplePipeline {
  return {
    name: 'earthlike coasts & ranges',
    description:
      'Terrain built the way Earth builds it: drifting plates make ocean basins and mountain belts, a warp bends the plate edges into coastlines, and rainfall routed downhill carves the valleys and draws the rivers.',
    state: {
      seed: 11,
      nodes: [
        {
          id: 'n1',
          type: 'tectonicUplift',
          label: 'plates',
          comment:
            'The reason this world has continents instead of blobs. Oceanic plates sit a basin depth below continental ones, and belts of uplift follow the boundaries where plates converge, so mountains come out as long chains rather than isolated lumps. Land height 0.58 against a 0.5 sea level leaves only a thin margin, which is what lets the noise below drown the continental edges into bays and islands.',
          enabled: true,
          params: {
            plateSize: 256,
            oceanFraction: 0.6,
            beltWidth: 64,
            rangeHeight: 0.34,
            landHeight: 0.58,
            basinDepth: 0.34,
          },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n2',
          type: 'terrainNoise',
          label: 'warp x',
          comment:
            'Pure plumbing: a very low frequency noise whose only job is to say how far east or west to displace the plate field. Two separate nodes are used so the two axes are independent, which is what makes the displacement swirl instead of slide.',
          enabled: true,
          params: { scale: 0.004, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n3',
          type: 'terrainNoise',
          label: 'warp y',
          comment: 'The north-south half of the same displacement. Its scale differs slightly so the two axes never line up into a diagonal grain.',
          enabled: true,
          params: { scale: 0.0045, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n4',
          type: 'domainWarp',
          label: 'warped plates',
          comment:
            'Plate boundaries are straight-ish bisectors between plate centres, which no real coast is. Displacing the whole field by up to 110 tiles turns those bisectors into headlands, bays and offshore islands without changing a single elevation value.',
          enabled: true,
          params: { strength: 110 },
          inputs: { source: 'n1', offsetX: 'n2', offsetY: 'n3' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n5',
          type: 'hypsometricCurve',
          label: 'range belts',
          comment:
            'A curve used as a switch rather than as terrain: with the pivot set at 0.72 — above continental crust, below the tops of the uplift belts — and a steep slope, this comes out near 1 inside a mountain belt and near 0 everywhere else. It is the mask that keeps jagged noise on the ranges.',
          enabled: true,
          params: { seaLevel: 0.72, steepness: 25 },
          inputs: { source: 'n4' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n6',
          type: 'terrainNoise',
          label: 'ridges',
          comment:
            'Ridged noise: each octave folded at its midline so crests are sharp and flanks are steep. On its own it would ridge the entire world, which is why it is masked to the belts below.',
          enabled: true,
          params: { scale: 0.01, style: 1, octaves: 7, lacunarity: 2.1, gain: 0.5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n7',
          type: 'terrainNoise',
          label: 'rolling detail',
          comment:
            'The unremarkable relief everywhere else: hills, rises, and the wobble that gives the coastline its small-scale shape.',
          enabled: true,
          params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n8',
          type: 'blendFields',
          label: 'ranges in the belts',
          comment:
            'Mixes the ridged noise into the plate uplift, but only where the belt mask allows, so the mountains are jagged and the plains stay smooth. This is the node that decides what a mountain range looks like here.',
          enabled: true,
          params: { weight: 0.8 },
          inputs: { a: 'n4', b: 'n6', mask: 'n5' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n9',
          type: 'blendFields',
          label: 'rolling relief',
          comment:
            'A light unmasked pass of the rolling noise over everything. Kept low so it textures the terrain rather than competing with the plate structure.',
          enabled: true,
          params: { weight: 0.16 },
          inputs: { a: 'n8', b: 'n7' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n10',
          type: 'hypsometricCurve',
          label: 'basins & platform',
          comment:
            'Earth has two typical elevations — abyssal floor and low continental platform — with a steep slope between them, and almost nothing sitting exactly at sea level. This pushes the blended field into that shape, which is what stops the map being fringed with shallows everywhere.',
          enabled: true,
          params: { seaLevel: 0.5, steepness: 9 },
          inputs: { source: 'n9' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n11',
          type: 'flowAccumulation',
          label: 'drainage',
          comment:
            'One unit of rain on every cell, routed downhill after the pits are flooded shut, counted where it passes. The result is the drainage network: threads in the headwaters, trunks near the coast, and nothing at all on the ridges.',
          enabled: true,
          params: { seaLevel: 0.5, catchmentScale: 3000, fillPits: 1, windowRadius: 40 },
          inputs: { elevation: 'n10' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n12',
          type: 'carveValleys',
          label: 'eroded terrain',
          comment:
            'The terrain the world is actually built on: rivers cut into it in proportion to what they carry, so channels sit in valleys, and the high ground between them reads as ridges because it is what did not get cut away.',
          enabled: true,
          params: { depth: 0.08, minFlow: 0.4, valleyWidth: 6 },
          inputs: { elevation: 'n10', flow: 'n11' },
          display: { mode: 'elevation', heightScale: 8 },
        },
        {
          id: 'n13',
          type: 'coastDistance',
          label: 'coast distance',
          comment:
            'Measured from the uneroded terrain because river valleys should not count as coastline. Beaches and the grass line are cut from this rather than from height, so their width follows the shore instead of the local gradient.',
          enabled: true,
          params: { seaLevel: 0.5, range: 32 },
          inputs: { elevation: 'n10' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n14',
          type: 'hypsometricCurve',
          label: 'land mask',
          comment:
            'The same curve-as-switch trick as the belt mask: pivoted just inland of the coastline with a very steep slope, it is 1 well inland and 0 at sea. Used to keep the rock layer off both the underwater continental slope and the beach, which would otherwise be a wall of sea cliff everywhere the shelf is steep.',
          enabled: true,
          params: { seaLevel: 0.57, steepness: 30 },
          inputs: { source: 'n13' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n15',
          type: 'slopeField',
          label: 'steepness',
          comment:
            'Bare rock is a question about steepness, not height — a high plateau is grassland and a low cliff is not. Radius 3 measures the grade of a mountainside rather than the roughness of individual cells.',
          enabled: true,
          params: { radius: 3, gain: 12 },
          inputs: { source: 'n12' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n16',
          type: 'combineFields',
          label: 'steep land',
          comment:
            'Multiply is masking: steepness times the land mask leaves steepness on land and zero at sea, so the rock layer below cannot paint the drowned continental slope.',
          enabled: true,
          params: { operation: 2, clamp: 1 },
          inputs: { a: 'n15', b: 'n14' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n17',
          type: 'thresholdTiles',
          label: 'sea & beach',
          comment:
            'The base layer, painting every cell: ocean below the sea line, sand above. Everything after this only overrides parts of it, so what survives is the strip of sand along the shore.',
          enabled: true,
          params: { threshold: 0.5, belowTile: 0, aboveTile: 1 },
          inputs: { source: 'n12' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n18',
          type: 'thresholdTiles',
          label: 'inland grass',
          comment:
            'Cut from coast distance, not height: 0.56 is about four tiles inland at this range, so beaches keep an even width around every bay and headland instead of pooling wherever the ground happens to be flat.',
          enabled: true,
          params: { threshold: 0.56, belowTile: -1, aboveTile: 2 },
          inputs: { source: 'n13' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n19',
          type: 'thresholdTiles',
          label: 'rock on steep ground',
          comment:
            'Rock wherever the land is steep enough that soil would not stay: the flanks of the ranges, canyon walls, and sea cliffs. Empty below the threshold so grass shows through.',
          enabled: true,
          params: { threshold: 0.45, belowTile: -1, aboveTile: 4 },
          inputs: { source: 'n16' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n20',
          type: 'riverFromFlow',
          label: 'rivers',
          comment:
            'Rivers as the drainage network rather than as traced springs: every cell above the flow threshold is water, so courses branch upstream, merge downstream, and widen toward the mouth. Painted with the ocean tile so a river mouth and the sea read as one body of water.',
          enabled: true,
          params: { minFlow: 0.55, maxWidth: 5, seaLevel: 0.5, riverTile: 0 },
          inputs: { flow: 'n11', elevation: 'n12' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n21',
          type: 'riverTowns',
          label: 'towns',
          comment:
            'Unchanged from the rivers & towns preset — it only wants river tiles and a terrain field, and it does not care that these rivers came from drainage instead of springs. Mouths and confluences are where settlements go.',
          enabled: true,
          params: { seaLevel: 0.5, spacing: 14 },
          inputs: { rivers: 'n20', elevation: 'n12' },
          display: { mode: 'markers', tileId: -1, glyph: '⌂', color: '#e0b06a' },
        },
      ],
    },
  };
}
