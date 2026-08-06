import { independentStreamPerLabel } from '../random/independentStreamPerLabel';
import type { Tileset } from '../world/tiles/tileset';
import type { GenCtx } from './genPass';
import type { GenParams } from './genParams';

export function createGenContext(params: GenParams, tileset: Tileset, cellCount: number): GenCtx {
  return {
    params,
    rng: (label) => independentStreamPerLabel(params.seed, label),
    tile: (role) => tileset.idForRole(role),
    elevation: new Float32Array(cellCount),
  };
}
