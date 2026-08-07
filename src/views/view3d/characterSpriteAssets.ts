import { CharacterSpriteSlabs } from './characterSpriteSlabs';
import { CharacterSpriteTextures } from './characterSpriteTextures';

/**
 * Everything a character frame needs on the GPU, cached together so a frame's slab and
 * its painted surfaces are built once and thrown away at the same moment.
 */
export class CharacterSpriteAssets {
  readonly textures = new CharacterSpriteTextures();
  readonly slabs = new CharacterSpriteSlabs();

  dispose(): void {
    this.textures.dispose();
    this.slabs.dispose();
  }
}
