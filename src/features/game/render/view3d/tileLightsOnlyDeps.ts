import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { WorldViewDeps } from '../worldViewDeps';

const NO_ITEM_ASSETS = { all: () => [], byId: () => undefined, onChange: () => () => {} };

export interface TileLitWorld {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
}

export function tileLightsOnlyDeps(world: TileLitWorld): WorldViewDeps {
  return {
    sampler: world.sampler,
    tileAssets: world.tileAssets,
    creatures: new CreatureAssets(),
    items: NO_ITEM_ASSETS,
    sim: { active: () => [] },
  } as unknown as WorldViewDeps;
}
