import type { RandomStream } from '../random/mulberry32';
import type { Grid } from '../world/grid';
import type { TileRole } from '../world/tiles/tileDef';
import type { GenParams } from './genParams';

export type ElevationField = Float32Array<ArrayBuffer>;

export interface GenCtx {
  readonly params: GenParams;
  rng(label: string): RandomStream;
  tile(role: TileRole): number;
  elevation: ElevationField;
}

export interface GenPass {
  name: string;
  apply(grid: Grid, ctx: GenCtx): void;
}
