import * as THREE from 'three';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';
import { spriteEdgeRuns, type SpriteEdgeRun, type SpriteEdgeSide } from '../../world/tiles/spriteEdgeRuns';
import { opaqueInk } from '../../world/tiles/inkColor';
import { QuadBuffer, type Quad } from './quadBuffer';

export const SPRITE_ART_MATERIAL = 0;
export const SPRITE_RIM_MATERIAL = 1;

const RIM_SHADE = 0.62;
const UNTINTED = new THREE.Color(0xffffff);
const SQUARE_UVS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

export interface SlabSize {
  width: number;
  height: number;
  depth: number;
}

interface SpriteCellGrid {
  xAt: (col: number) => number;
  yAt: (row: number) => number;
}

interface RimFace {
  corners: readonly (readonly number[])[];
  normal: readonly number[];
}

/**
 * The sprite as a solid slab: art on the front and back, and side walls that trace the
 * painted silhouette, so the thickness follows the drawing instead of a square rim.
 */
export function spriteSlabGeometry(sprite: SpriteArt, size: SlabSize): THREE.BufferGeometry {
  const buffer = new QuadBuffer();
  for (const face of artFaces(size)) buffer.push(face);
  buffer.closeGroup(SPRITE_ART_MATERIAL);
  const grid = spriteCellGrid(sprite, size);
  for (const run of spriteEdgeRuns(sprite)) buffer.push(rimQuad(run, grid, size.depth / 2));
  buffer.closeGroup(SPRITE_RIM_MATERIAL);
  return buffer.geometry();
}

function artFaces({ width, height, depth }: SlabSize): Quad[] {
  const [x, y, z] = [width / 2, height / 2, depth / 2];
  return [
    {
      corners: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]],
      normal: [0, 0, 1],
      uvs: SQUARE_UVS,
      color: UNTINTED,
    },
    {
      corners: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]],
      normal: [0, 0, -1],
      uvs: SQUARE_UVS,
      color: UNTINTED,
    },
  ];
}

function spriteCellGrid(sprite: SpriteArt, { width, height }: SlabSize): SpriteCellGrid {
  const cells = spriteGridSize(sprite);
  return {
    xAt: (col) => -width / 2 + (col / cells) * width,
    yAt: (row) => height / 2 - (row / cells) * height,
  };
}

function rimQuad(run: SpriteEdgeRun, grid: SpriteCellGrid, halfDepth: number): Quad {
  return { ...RIM_FACES[run.side](run, grid, halfDepth), uvs: SQUARE_UVS, color: shadedInk(run.ink) };
}

const RIM_FACES: Record<
  SpriteEdgeSide,
  (run: SpriteEdgeRun, grid: SpriteCellGrid, halfDepth: number) => RimFace
> = {
  left: (run, grid, z) => {
    const [x, low, high] = [grid.xAt(run.col), grid.yAt(run.row + run.cells), grid.yAt(run.row)];
    return {
      corners: [[x, low, -z], [x, low, z], [x, high, z], [x, high, -z]],
      normal: [-1, 0, 0],
    };
  },
  right: (run, grid, z) => {
    const [x, low, high] = [grid.xAt(run.col + 1), grid.yAt(run.row + run.cells), grid.yAt(run.row)];
    return {
      corners: [[x, low, z], [x, low, -z], [x, high, -z], [x, high, z]],
      normal: [1, 0, 0],
    };
  },
  top: (run, grid, z) => {
    const [y, near, far] = [grid.yAt(run.row), grid.xAt(run.col), grid.xAt(run.col + run.cells)];
    return {
      corners: [[near, y, z], [far, y, z], [far, y, -z], [near, y, -z]],
      normal: [0, 1, 0],
    };
  },
  bottom: (run, grid, z) => {
    const [y, near, far] = [grid.yAt(run.row + 1), grid.xAt(run.col), grid.xAt(run.col + run.cells)];
    return {
      corners: [[near, y, -z], [far, y, -z], [far, y, z], [near, y, z]],
      normal: [0, -1, 0],
    };
  },
};

function shadedInk(ink: string): THREE.Color {
  return new THREE.Color().setStyle(opaqueInk(ink), THREE.SRGBColorSpace).multiplyScalar(RIM_SHADE);
}
