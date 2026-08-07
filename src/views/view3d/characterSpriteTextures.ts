import type * as THREE from 'three';
import type { SpriteArt } from '../../world/tiles/spriteArt';
import { spriteMaterial } from './spriteMaterial';

export class CharacterSpriteTextures {
  private readonly materials = new Map<string, THREE.MeshLambertMaterial>();

  materialFor(key: string, sprite: SpriteArt): THREE.MeshLambertMaterial {
    const cached = this.materials.get(key);
    if (cached) return cached;
    const material = spriteMaterial(sprite);
    this.materials.set(key, material);
    return material;
  }

  dispose(): void {
    for (const material of this.materials.values()) {
      material.map?.dispose();
      material.dispose();
    }
    this.materials.clear();
  }
}
