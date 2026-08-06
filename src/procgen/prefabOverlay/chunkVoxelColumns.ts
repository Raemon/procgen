import { EMPTY_VOXEL } from '../../prefabs/prefabDef';

export type VoxelColumn = number[];

export class ChunkVoxelColumns {
  private readonly columns = new Map<number, VoxelColumn>();

  paint(cellIndex: number, layer: number, tileId: number): void {
    const column = this.columns.get(cellIndex) ?? [];
    while (column.length <= layer) column.push(EMPTY_VOXEL);
    column[layer] = tileId;
    this.columns.set(cellIndex, column);
  }

  columnAt(cellIndex: number): VoxelColumn | null {
    return this.columns.get(cellIndex) ?? null;
  }

  isEmpty(): boolean {
    return this.columns.size === 0;
  }
}

export function groundVoxelOf(column: VoxelColumn | null): number {
  return column?.[0] ?? EMPTY_VOXEL;
}

export function topVoxelOf(column: VoxelColumn | null): number {
  if (!column) return EMPTY_VOXEL;
  for (let layer = column.length - 1; layer >= 0; layer--) {
    if (column[layer] !== EMPTY_VOXEL) return column[layer]!;
  }
  return EMPTY_VOXEL;
}
