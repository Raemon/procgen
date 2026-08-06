import { blankVoxels, voxelAt, withCenteredAnchor, type Prefab } from './prefabDef';

export interface FootprintCell {
  x: number;
  y: number;
}

export function normalizedQuarterTurns(turns: number): number {
  return ((Math.round(turns) % 4) + 4) % 4;
}

export function rotatedWidth(prefab: Prefab, turns: number): number {
  return normalizedQuarterTurns(turns) % 2 === 0 ? prefab.width : prefab.depth;
}

export function rotatedDepth(prefab: Prefab, turns: number): number {
  return normalizedQuarterTurns(turns) % 2 === 0 ? prefab.depth : prefab.width;
}

export function unrotatedCell(prefab: Prefab, turns: number, x: number, y: number): FootprintCell {
  if (normalizedQuarterTurns(turns) === 1) return { x: y, y: prefab.depth - 1 - x };
  if (normalizedQuarterTurns(turns) === 2) {
    return { x: prefab.width - 1 - x, y: prefab.depth - 1 - y };
  }
  if (normalizedQuarterTurns(turns) === 3) return { x: prefab.width - 1 - y, y: x };
  return { x, y };
}

export function rotatedAnchorX(prefab: Prefab, turns: number): number {
  return anchorAfterRotation(prefab, turns).x;
}

export function rotatedAnchorY(prefab: Prefab, turns: number): number {
  return anchorAfterRotation(prefab, turns).y;
}

export function rotatedPrefab(prefab: Prefab, turns: number): Prefab {
  const width = rotatedWidth(prefab, turns);
  const depth = rotatedDepth(prefab, turns);
  const rotated: Prefab = { ...prefab, width, depth, voxels: blankVoxels(width, depth, prefab.layers) };
  for (let layer = 0; layer < prefab.layers; layer++) {
    for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++) {
        const source = unrotatedCell(prefab, turns, x, y);
        rotated.voxels[(layer * depth + y) * width + x] = voxelAt(prefab, source.x, source.y, layer);
      }
    }
  }
  return withCenteredAnchor(rotated);
}

function anchorAfterRotation(prefab: Prefab, turns: number): FootprintCell {
  const width = rotatedWidth(prefab, turns);
  const depth = rotatedDepth(prefab, turns);
  for (let y = 0; y < depth; y++) {
    for (let x = 0; x < width; x++) {
      const source = unrotatedCell(prefab, turns, x, y);
      if (source.x === prefab.anchorX && source.y === prefab.anchorY) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}
