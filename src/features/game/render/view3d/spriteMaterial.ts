import * as THREE from 'three';
import { paintFacePixels } from '../paintFacePixels';
import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';

export function spriteMaterial(
  texture: THREE.CanvasTexture,
  tint = 0xffffff,
): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: texture,
    color: tint,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
}

export function spriteTexture(sprite: SpriteArt): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = spriteGridSize(sprite);
  paintFacePixels(canvas.getContext('2d')!, sprite, null, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
