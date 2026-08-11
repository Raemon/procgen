import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { WorldViewDeps } from '@/features/game/render/worldViewDeps';
import type { HeadlessWorld } from '../../headlessWorld';

const NO_ITEM_ASSETS = { all: () => [], byId: () => undefined, onChange: () => () => {} };

export function tileLightsOnlyDeps(world: HeadlessWorld): WorldViewDeps {
  return {
    sampler: world.sampler,
    tileAssets: world.tileAssets,
    creatures: new CreatureAssets(),
    items: NO_ITEM_ASSETS,
    sim: { active: () => [] },
  } as unknown as WorldViewDeps;
}
