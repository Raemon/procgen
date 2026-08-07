import { CharacterSpriteSlabs } from './characterSpriteSlabs';
import { CharacterSpriteTextures } from './characterSpriteTextures';

export class CharacterSpriteAssets {
  readonly textures = new CharacterSpriteTextures();
  readonly slabs = new CharacterSpriteSlabs();

  dispose(): void {
    this.textures.dispose();
    this.slabs.dispose();
  }
}
