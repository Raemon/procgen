import type { World } from '../../world/world';

export interface PlayerCenteredView {
  recenterOnPlayer(): void;
}

export function recenterViewsWhenPlayerMoves(world: World, views: PlayerCenteredView[]): void {
  world.on('player-moved', () => {
    for (const view of views) view.recenterOnPlayer();
  });
}
