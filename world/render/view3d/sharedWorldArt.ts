import { disposeSharedCreatureSurfaces } from './creatureSurfaces';
import { disposeSharedItemSurfaces } from './itemSurfaces';
import { disposeSharedTileSurfaces } from './tileSurfaces';
import { disposeSharedPngMaterials } from './pngFaceMaterials';
import { disposeSharedPngTextures } from './pngTileTextures';

export function disposeSharedWorldArt(): void {
  disposeSharedItemSurfaces();
  disposeSharedCreatureSurfaces();
  disposeSharedTileSurfaces();
  disposeSharedPngMaterials();
  disposeSharedPngTextures();
}
