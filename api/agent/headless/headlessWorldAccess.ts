import type { ServerWorld, WorldAccess } from '../serverWorld';

export function headlessWorldAccess(world: ServerWorld): WorldAccess {
  return { current: () => world, persistWorld: () => {} };
}
