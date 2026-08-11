import * as THREE from 'three';
import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { spriteSlabGeometry } from './spriteSlabGeometry';

const RIM_PIXELS_DEEP = 2;

export class CharacterSpriteSlabs {
  private readonly slabs = new Map<string, THREE.BufferGeometry>();

  slabFor(key: string, sprite: SpriteArt): THREE.BufferGeometry {
    const cached = this.slabs.get(key);
    if (cached) return cached;
    const slab = spriteSlabGeometry(sprite, unitQuadSize(sprite));
    this.slabs.set(key, slab);
    return slab;
  }

  dispose(): void {
    for (const slab of this.slabs.values()) slab.dispose();
    this.slabs.clear();
  }
}

function unitQuadSize(sprite: SpriteArt) {
  return { width: 1, height: 1, depth: RIM_PIXELS_DEEP / spriteGridSize(sprite) };
}
