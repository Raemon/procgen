import { EMPTY_VOXEL } from '../../assets/pieces/pieceDef';

export type VoxelColumn = number[];

export class ChunkVoxelColumns {
  private readonly columns = new Map<number, VoxelColumn>();

  paint(cellIndex: number, layer: number, packed: number): void {
    const column = this.columns.get(cellIndex) ?? [];
    while (column.length <= layer) column.push(EMPTY_VOXEL);
    column[layer] = packed;
    this.columns.set(cellIndex, column);
  }

  packedColumnAt(cellIndex: number): VoxelColumn | null {
    return this.columns.get(cellIndex) ?? null;
  }

  forEachGroundPackedVoxel(apply: (cellIndex: number, packed: number) => void): void {
    for (const [cellIndex, column] of this.columns) {
      const ground = column[0] ?? EMPTY_VOXEL;
      if (ground !== EMPTY_VOXEL) apply(cellIndex, ground);
    }
  }

  isEmpty(): boolean {
    return this.columns.size === 0;
  }
}

export function topPackedVoxelOf(column: VoxelColumn | null): number {
  if (!column) return EMPTY_VOXEL;
  for (let layer = column.length - 1; layer >= 0; layer--) {
    if (column[layer] !== EMPTY_VOXEL) return column[layer]!;
  }
  return EMPTY_VOXEL;
}
