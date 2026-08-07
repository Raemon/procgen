import * as THREE from 'three';
import { paintSpritePixels } from '../paintSpritePixels';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';

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
  paintSpritePixels(canvas.getContext('2d')!, sprite, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
