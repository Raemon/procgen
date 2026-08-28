import { assetId } from '@/features/asset-library/asset';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId, type TileDef } from '@/features/asset-library/tiles/tileDef';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { AgentObservation } from '../observation';

export const MEADOW_TILE = assetId<'tiles'>(0);

export function meadowTileDef(): TileDef {
  return { ...newTileWithId(MEADOW_TILE), name: 'meadow', symbol: '"', walkable: true, height: 1 };
}

export const meadowTiles = new TileAssets([meadowTileDef()]);

export function stubSampler(
  tileAt: (x: number, y: number) => number,
  elevationAt: (x: number, y: number) => number = () => 0,
  overrides: Partial<WorldSampler> = {},
): WorldSampler {
  return {
    tileAt,
    elevationAt,
    markersIn: () => [],
    itemSpawnsIn: () => [],
    creatureSpawnsIn: () => [],
    ...overrides,
  } as unknown as WorldSampler;
}

export function glyphAt(observation: AgentObservation, dx: number, dy: number): string {
  const center = Math.floor(observation.viewSize / 2);
  return observation.view[center + dy]![center + dx]!;
}
