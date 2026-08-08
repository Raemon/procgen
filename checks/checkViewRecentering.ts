import { PanOffset } from '../world/render/camera/panOffset';
import { WorldRenderers, type WorldRenderer } from '../frontend/worldRenderers';
import { World } from '../world/world';
import type { CheckReporter } from './checkReporter';

function recenteringRenderer(recenterOnPlayer: () => void): WorldRenderer {
  return { redraw: () => {}, recenterOnPlayer };
}

function recenterViewsWhenPlayerMoves(world: World, views: WorldRenderer[]): void {
  const renderers = new WorldRenderers();
  for (const view of views) renderers.add(view);
  world.on('player-moved', () => renderers.recenterAll());
}

export function checkViewRecentering(check: CheckReporter): void {
  const pannedViews = [new PanOffset(), new PanOffset()];
  pannedViews.forEach((offset) => offset.shiftBy(40, -25));
  const walkableWorld = new World(() => true);
  recenterViewsWhenPlayerMoves(
    walkableWorld,
    pannedViews.map((offset) => recenteringRenderer(() => void offset.recenter())),
  );
  check(
    'panning still holds before the player moves',
    pannedViews.every((offset) => offset.tilesX() !== 0),
  );
  walkableWorld.tryStep(1, 0);
  check(
    'stepping snaps every view back onto the player',
    pannedViews.every((offset) => offset.tilesX() === 0 && offset.tilesY() === 0),
  );

  const walledWorld = new World(() => false);
  const walledViewPan = new PanOffset();
  walledViewPan.shiftBy(40, -25);
  recenterViewsWhenPlayerMoves(walledWorld, [
    recenteringRenderer(() => void walledViewPan.recenter()),
  ]);
  walledWorld.tryStep(1, 0);
  check('a blocked step leaves the camera where the player put it', walledViewPan.tilesX() === 40);
}
