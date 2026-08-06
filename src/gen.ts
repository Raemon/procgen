// The generator: an ordered array of passes over a Grid. This is the seed of a
// future rule-composition editor, so the shape matters more than the passes —
// each pass is a named, self-contained step that reads the shared GenCtx
// (seeded rng streams, the knobs, the tileset, and scratch fields like the raw
// elevation) and mutates the grid. Later passes can read what earlier passes
// computed; nothing else is shared.

import { EMPTY, Grid } from './grid';
import { rngFor } from './rng';
import { fractalNoise } from './noise';
import { hashString } from './rng';
import type { Tileset, TileRole } from './tiles';

export interface GenParams {
  seed: number;
  size: number;
  /** Noise frequency in cycles per tile — bigger = choppier terrain. */
  noiseScale: number;
  /** Elevation below this is water (0..1). */
  waterLevel: number;
  /** Elevation above this is rock (0..1). */
  rockLevel: number;
  /** Cellular-automata majority smoothing iterations (0..5). */
  smoothing: number;
  /** Chance a grass tile grows a tree (0..1). */
  treeDensity: number;
}

export const DEFAULT_PARAMS: GenParams = {
  seed: 1234,
  size: 64,
  noiseScale: 0.06,
  waterLevel: 0.35,
  rockLevel: 0.72,
  smoothing: 1,
  treeDensity: 0.12,
};

export interface GenCtx {
  readonly params: GenParams;
  readonly tileset: Tileset;
  /** A fresh deterministic rng stream per label — see rng.ts rngFor. */
  rng(label: string): () => number;
  /** Tile id filling a role, or -1 when the tileset has none for it. */
  tile(role: TileRole): number;
  /** Scratch: the raw elevation field, written by elevationNoise, one float per
   *  cell, row-major. Later passes read it to answer "how high is this?". */
  elevation: Float32Array;
}

export interface GenPass {
  name: string;
  apply(grid: Grid, ctx: GenCtx): void;
}

/** How wide the beach band above the waterline is, in elevation units. */
const SAND_BAND = 0.05;

// ---- passes ----------------------------------------------------------------

const elevationNoise: GenPass = {
  name: 'elevationNoise',
  apply(grid, ctx) {
    const { seed, noiseScale } = ctx.params;
    const noiseSeed = hashString(`${seed}:elevation`);
    // Normalize this world's field to its own [0, 1] so the water/rock level
    // knobs always have terrain on both sides of them.
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const e = fractalNoise(x * noiseScale, y * noiseScale, noiseSeed, 4);
        ctx.elevation[y * grid.width + x] = e;
        if (e < min) min = e;
        if (e > max) max = e;
      }
    }
    const span = max - min || 1;
    for (let i = 0; i < ctx.elevation.length; i++) {
      ctx.elevation[i] = (ctx.elevation[i]! - min) / span;
    }
  },
};

const thresholdTerrain: GenPass = {
  name: 'thresholdTerrain',
  apply(grid, ctx) {
    const { waterLevel, rockLevel } = ctx.params;
    const water = ctx.tile('water');
    const sand = ctx.tile('sand');
    const grass = ctx.tile('grass');
    const rock = ctx.tile('rock');
    grid.forEach((x, y) => {
      const e = ctx.elevation[y * grid.width + x]!;
      let id: number;
      if (e < waterLevel) id = water;
      else if (e < waterLevel + SAND_BAND) id = sand;
      else if (e >= rockLevel) id = rock;
      else id = grass;
      if (id >= 0) grid.set(x, y, id);
    });
  },
};

const caSmooth: GenPass = {
  name: 'caSmooth',
  apply(grid, ctx) {
    const iterations = Math.max(0, Math.min(5, Math.round(ctx.params.smoothing)));
    if (iterations === 0) return;
    const scratch = grid.clone();
    for (let it = 0; it < iterations; it++) {
      scratch.copyFrom(grid);
      grid.forEach((x, y, self) => {
        if (self === EMPTY) return;
        // Majority vote over the 3x3 neighborhood (self included). Off-grid
        // neighbors count as the cell's own tile, so edges don't erode.
        const votes = new Map<number, number>();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            let t = scratch.get(x + dx, y + dy);
            if (t === EMPTY) t = self;
            votes.set(t, (votes.get(t) ?? 0) + 1);
          }
        }
        let best = self;
        let bestCount = -1;
        for (const [t, n] of votes) {
          if (n > bestCount || (n === bestCount && t === self)) {
            best = t;
            bestCount = n;
          }
        }
        grid.set(x, y, best);
      });
    }
  },
};

const scatterTrees: GenPass = {
  name: 'scatterTrees',
  apply(grid, ctx) {
    const tree = ctx.tile('tree');
    const grass = ctx.tile('grass');
    if (tree < 0 || grass < 0) return;
    const rng = ctx.rng('trees');
    const density = ctx.params.treeDensity;
    // rng consumed for every grass cell in fixed order, so the same seed always
    // grows the same forest regardless of density.
    grid.forEach((x, y, t) => {
      if (t === grass && rng() < density) grid.set(x, y, tree);
    });
  },
};

/** The pipeline, in the order it runs. Append here to grow the generator. */
export const PASSES: readonly GenPass[] = [
  elevationNoise,
  thresholdTerrain,
  caSmooth,
  scatterTrees,
];

/** Run the whole pipeline and return the grid plus the ctx (for scratch reads
 *  like elevation, which the 3D view could use later). */
export function generate(params: GenParams, tileset: Tileset): { grid: Grid; ctx: GenCtx } {
  const size = Math.max(8, Math.min(256, Math.round(params.size)));
  const grid = new Grid(size, size);
  const ctx: GenCtx = {
    params,
    tileset,
    rng: (label) => rngFor(params.seed, label),
    tile: (role) => tileset.idForRole(role),
    elevation: new Float32Array(size * size),
  };
  for (const pass of PASSES) pass.apply(grid, ctx);
  return { grid, ctx };
}
