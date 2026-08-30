import * as THREE from 'three';
import type { SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { COPLANAR_LANES, coplanarLane, coplanarPullOf, pullTowardCamera } from './coplanarPull';
import { spriteMaterial, spriteTexture } from './spriteMaterial';
import { spriteRimMaterial } from './spriteRimMaterial';

const UNTINTED = 0xffffff;
const FRAME_LANES = 4;
const CHARACTER_LANES = COPLANAR_LANES / FRAME_LANES;

export function characterLane(character: string, frame: string): number {
  return coplanarLane(character, CHARACTER_LANES) * FRAME_LANES + coplanarLane(frame, FRAME_LANES);
}

export class CharacterSpriteTextures {
  private readonly textures = new Map<string, THREE.CanvasTexture>();
  private readonly materials = new Map<string, THREE.MeshLambertMaterial>();
  private readonly rims = new Map<string, THREE.MeshLambertMaterial>();

  rimFor(characterId: number, tint = UNTINTED): THREE.MeshLambertMaterial {
    const character = `${characterId}@${tint}`;
    const cached = this.rims.get(character);
    if (cached) return cached;
    const material = spriteRimMaterial(tint);
    pullTowardCamera(material, coplanarPullOf('character', characterLane(character, 'rim')));
    this.rims.set(character, material);
    return material;
  }

  materialFor(key: string, sprite: SpriteArt, characterId: number, tint = UNTINTED): THREE.MeshLambertMaterial {
    const tintedKey = `${key}@${tint}`;
    const cached = this.materials.get(tintedKey);
    if (cached) return cached;
    const material = spriteMaterial(this.textureFor(key, sprite), tint);
    pullTowardCamera(material, coplanarPullOf('character', characterLane(`${characterId}@${tint}`, tintedKey)));
    this.materials.set(tintedKey, material);
    return material;
  }

  dispose(): void {
    for (const material of this.materials.values()) material.dispose();
    for (const rim of this.rims.values()) rim.dispose();
    for (const texture of this.textures.values()) texture.dispose();
    this.materials.clear();
    this.rims.clear();
    this.textures.clear();
  }

  private textureFor(key: string, sprite: SpriteArt): THREE.CanvasTexture {
    const cached = this.textures.get(key);
    if (cached) return cached;
    const texture = spriteTexture(sprite);
    this.textures.set(key, texture);
    return texture;
  }
}
