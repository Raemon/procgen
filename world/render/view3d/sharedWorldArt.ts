import { disposeSharedCreatureSurfaces } from './creatureSurfaces';
import { disposeSharedItemSurfaces } from './itemSurfaces';
import { disposeSharedTileSurfaces } from './tileSurfaces';

export function disposeSharedWorldArt(): void {
  disposeSharedItemSurfaces();
  disposeSharedCreatureSurfaces();
  disposeSharedTileSurfaces();
}
