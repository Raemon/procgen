import { earthlikeCoastsAndRanges } from './earthlikeCoastsAndRanges';
import type { ExamplePipeline } from './examplePipeline';
import { fallenMetropolis } from './fallenMetropolis';
import { poleToEquator } from './poleToEquator';
import { settlementsAndWildlife } from './settlementsAndWildlife';

export type { ExamplePipeline };

export function examplePipelines(): ExamplePipeline[] {
  return [
    islandsAndForests(),
    cavesAndMonsters(),
    customScriptDemo(),
    endlessLabyrinth(),
    nestedLabyrinths(),
    riversAndTowns(),
    theSpokenWorld(),
    earthlikeCoastsAndRanges(),
    settlementsAndWildlife(),
    fallenMetropolis(),
    poleToEquator(),
  ];
}

function islandsAndForests(): ExamplePipeline {
  return {
    name: 'islands & forests',
    description:
      'One noise field drives everything: elevation, three stacked biome thresholds, and masked tree scatter.',
    state: {
      seed: 1234,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'height noise',
          comment:
            'The single source of truth for this world: every other node reads it, so biomes and trees automatically agree with the terrain shape. Low scale + 5 octaves = continent-sized islands with rough coastlines.',
          enabled: true,
          params: { scale: 0.05, octaves: 5 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 3 },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'ocean & sand',
          comment:
            'The base layer, so it paints every cell: water below 0.45, sand above. The two layers after this only override parts of it.',
          enabled: true,
          params: { threshold: 0.45, belowTile: 0, aboveTile: 1 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'thresholdTiles',
          label: 'grassland',
          comment:
            'Below is "(empty)" so the sand layer shows through near the coast; only cells above 0.52 get grass. Stacking thresholds this way is cheaper to tune than one node with many bands.',
          enabled: true,
          params: { threshold: 0.52, belowTile: -1, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'thresholdTiles',
          label: 'peaks',
          comment:
            'Same trick one band higher: rock only above 0.68, everything else left empty so grass shows through.',
          enabled: true,
          params: { threshold: 0.68, belowTile: -1, aboveTile: 4 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n5',
          type: 'scatterPoints',
          label: 'trees',
          comment:
            'Masked to the 0.54–0.66 height band so trees only grow on grassland — above the coast, below the peaks. Styled from the tree tile so tile edits restyle the forest.',
          enabled: true,
          params: { density: 0.08, maskAtLeast: 0.54, maskAtMost: 0.66 },
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
    description:
      'A cave crawl: noise thresholded into floor vs wall, monsters scattered only in the open low areas.',
    state: {
      seed: 99,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'cave noise',
          comment:
            'Hidden because it is raw material, not terrain: higher scale than the islands example so caves read as winding tunnels rather than continents.',
          enabled: true,
          params: { scale: 0.09, octaves: 5 },
          inputs: {},
          display: { mode: 'hidden' },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'floor & walls',
          comment:
            'One threshold is the whole cave: sand floor below 0.52, rock walls above. No empty tiles — a cave should have no gaps.',
          enabled: true,
          params: { threshold: 0.52, belowTile: 1, aboveTile: 4 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'scatterPoints',
          label: 'monsters',
          comment:
            'Mask ≤ 0.45 keeps monsters strictly inside open floor (walls start at 0.52), and the sparse density makes each encounter matter. Custom glyph instead of a tile because no tileset tile means "monster".',
          enabled: true,
          params: { density: 0.012, maskAtLeast: 0, maskAtMost: 0.45 },
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
    description:
      'Shows the in-browser script node: a noise field turned into contour bands with a few lines of code.',
    state: {
      seed: 7,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'base noise',
          comment:
            "Kept visible as elevation so you can see the script's bands follow the height contours exactly — both read the same field.",
          enabled: true,
          params: { scale: 0.04, octaves: 4 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 2.5 },
        },
        {
          id: 'n2',
          type: 'customScript',
          label: 'script: contour bands',
          comment:
            'Something no built-in node does: quantize a field into N tile bands. Edit the code, hit apply, and the world updates — the point of the script node.',
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
    description:
      'A single maze node: one labyrinth per chunk, stitched to its neighbors through border doors.',
    state: {
      seed: 41,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'labyrinth',
          comment:
            'One node is the whole world: each chunk carves its own maze and the door-per-edge stitching keeps every chunk reachable. Corridor 3 / wall 1 + dfs for the traditional long-corridor look; a little braid so it is not all dead ends.',
          enabled: true,
          params: {
            corridor: 3,
            wall: 1,
            mazeChunks: 1,
            carver: 0,
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

function nestedLabyrinths(): ExamplePipeline {
  return {
    name: 'nested labyrinths',
    description:
      'A labyrinth inside a labyrinth: a small hedge maze fills the world, and a huge rock maze with empty floors is layered over it, so the hedges show through the giant corridors.',
    state: {
      seed: 77,
      nodes: [
        {
          id: 'n1',
          type: 'mazeChunk',
          label: 'inner hedge maze',
          comment:
            'The fine maze, one per chunk: tree walls on grass floors read as garden hedges. Extra doors and braid keep it open enough to survive the outer walls being stamped on top.',
          enabled: true,
          params: {
            corridor: 3,
            wall: 1,
            mazeChunks: 1,
            carver: 0,
            braid: 0.4,
            doorsPerEdge: 3,
            wallTile: 3,
            floorTile: 2,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n2',
          type: 'mazeChunk',
          label: 'outer rock maze',
          comment:
            'The higher-order labyrinth: one maze spanning 4×4 chunks with 24-wide corridors and 8-thick rock walls. Its floor is (empty), so wherever the giant corridors run, the hedge maze underneath shows through — that emptiness is what nests the two.',
          enabled: true,
          params: {
            corridor: 24,
            wall: 8,
            mazeChunks: 4,
            carver: 0,
            braid: 0.1,
            doorsPerEdge: 1,
            wallTile: 4,
            floorTile: -1,
          },
          inputs: {},
          display: { mode: 'tileLayer' },
        },
      ],
    },
  };
}

function riversAndTowns(): ExamplePipeline {
  return {
    name: 'rivers & towns',
    description:
      'Rivers trace downhill from springs to the sea across noise terrain, and towns are founded where rivers meet the ocean or meet each other.',
    state: {
      seed: 20,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'terrain',
          comment:
            'One elevation field drives everything downstream: the land layer, the river courses, and where towns can appear all read this same node, so they always agree.',
          enabled: true,
          params: { scale: 0.05, octaves: 5 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 3 },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'sea & land',
          comment:
            'Base layer painting every cell: ocean below 0.45, grass above. The rivers node uses the same 0.45 as its sea level so river mouths land exactly on this coastline.',
          enabled: true,
          params: { threshold: 0.45, belowTile: 0, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'riverTiles',
          label: 'rivers',
          comment:
            'Springs on ground above 0.62 flow down the steepest path with a little meander until they hit sea level. Painted with the water tile so rivers and ocean read as one body of water.',
          enabled: true,
          params: {
            sourceDensity: 0.003,
            minSourceHeight: 0.62,
            seaLevel: 0.45,
            maxLength: 80,
            meander: 0.04,
            riverTile: 0,
          },
          inputs: { elevation: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'riverTowns',
          label: 'towns',
          comment:
            'Reads the rivers and the same terrain: a town candidate is any river cell touching the sea (a mouth) or with three river neighbors (a junction), thinned to one town per 14 tiles.',
          enabled: true,
          params: { seaLevel: 0.45, spacing: 14 },
          inputs: { rivers: 'n3', elevation: 'n1' },
          display: { mode: 'markers', tileId: -1, glyph: '⌂', color: '#e0b06a' },
        },
      ],
    },
  };
}

function theSpokenWorld(): ExamplePipeline {
  return {
    name: 'the spoken world',
    description:
      'Rivers, towns and standing stones named in a language the world generates from its seed, and sealed vaults that only open when the true name of the land around them is spoken in the speak bar.',
    state: {
      seed: 20,
      nodes: [
        {
          id: 'n1',
          type: 'noiseField',
          label: 'terrain',
          comment:
            'One elevation field drives everything: land, rivers, towns, stones and vault sites all read this node, so every named thing agrees with the ground it is named for.',
          enabled: true,
          params: { scale: 0.05, octaves: 5 },
          inputs: {},
          display: { mode: 'elevation', heightScale: 3 },
        },
        {
          id: 'n2',
          type: 'thresholdTiles',
          label: 'sea & land',
          comment:
            'Base layer painting every cell: ocean below 0.45, grass above. The rivers node uses the same 0.45 so mouths land exactly on this coastline.',
          enabled: true,
          params: { threshold: 0.45, belowTile: 0, aboveTile: 2 },
          inputs: { source: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n3',
          type: 'riverTiles',
          label: 'rivers',
          comment:
            'Springs above 0.62 flow downhill to the sea. Rivers are what the naming nodes treat as water, so river places get water names.',
          enabled: true,
          params: {
            sourceDensity: 0.003,
            minSourceHeight: 0.62,
            seaLevel: 0.45,
            maxLength: 80,
            meander: 0.04,
            riverTile: 0,
          },
          inputs: { elevation: 'n1' },
          display: { mode: 'tileLayer' },
        },
        {
          id: 'n4',
          type: 'riverTowns',
          label: 'towns',
          comment:
            'Town candidates at river mouths and junctions, hidden here because the named copy of these points is what gets displayed.',
          enabled: true,
          params: { seaLevel: 0.45, spacing: 14 },
          inputs: { rivers: 'n3', elevation: 'n1' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n5',
          type: 'standingStones',
          label: 'stones',
          comment:
            'Mute stones on open ground, hidden for the same reason: the named copy below is the displayed one.',
          enabled: true,
          params: { spacing: 20, minHeight: 0.5, maxHeight: 0.85 },
          inputs: { terrain: 'n1' },
          display: { mode: 'hidden' },
        },
        {
          id: 'n6',
          type: 'namePlaces',
          label: 'named towns',
          comment:
            'Every town gains a name in the world tongue built from its actual site, so a confluence town is literally called meet-water in the local language.',
          enabled: true,
          params: {},
          inputs: { places: 'n4', terrain: 'n1', water: 'n3' },
          display: { mode: 'markers', tileId: -1, glyph: '⌂', color: '#e0b06a' },
        },
        {
          id: 'n7',
          type: 'namePlaces',
          label: 'inscribed stones',
          comment:
            'The stones get inscriptions from the same lexicon. Comparing a stone word with the land around it is how the language is learned.',
          enabled: true,
          params: {},
          inputs: { places: 'n5', terrain: 'n1', water: 'n3' },
          display: { mode: 'markers', tileId: -1, glyph: 'ᛟ', color: '#9ac2d0' },
        },
        {
          id: 'n8',
          type: 'wordVaults',
          label: 'sealed vaults',
          comment:
            'Walled vaults with no keyhole. Stand near one and speak the true name of the land it sits in — learned from the stones and town names — and its door opens for good.',
          enabled: true,
          params: { spacing: 44, minHeight: 0.5, maxHeight: 0.8, wallTile: 17 },
          inputs: { terrain: 'n1' },
          display: { mode: 'markers', tileId: -1, glyph: '✶', color: '#e8c26a' },
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
