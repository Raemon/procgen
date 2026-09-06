import type { WorldBuilds } from '@/features/asset-library/worlds/eval/builtValues';
import type { EntityRegistry } from '@/features/game/multiplayer/game/entities';
import type { GameLoop } from '@/features/game/multiplayer/game/gameLoop';

export function healthOf(loop: GameLoop, registry: EntityRegistry, builds: WorldBuilds) {
  return {
    ok: true,
    tick: loop.tick,
    players: registry.countByKind('player'),
    agents: registry.countByKind('agent'),
    builds: builds.summary(),
  };
}
