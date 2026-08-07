import * as THREE from 'three';
import { BILLBOARD, LYING_FLAT, type ItemDef } from '../../items/itemDef';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';
import { paintSpritePixels } from '../paintSpritePixels';
import { cubeFaceMaterials } from './faceArtMaterials';

const TOP = 2;
const BOTTOM = 3;
const SOUTH = 4;
const NORTH = 5;

export function isBillboard(item: ItemDef): boolean {
  return item.render === BILLBOARD;
}

export function isLyingFlat(item: ItemDef): boolean {
  return item.orientation === LYING_FLAT;
}

export function itemGeometry(item: ItemDef): THREE.BoxGeometry {
  if (!isBillboard(item)) return new THREE.BoxGeometry(item.size, item.size, item.size);
  return isLyingFlat(item)
    ? new THREE.BoxGeometry(item.size, item.thickness, item.size)
    : new THREE.BoxGeometry(item.size, item.size, item.thickness);
}

export function itemHalfHeight(item: ItemDef): number {
  return (isBillboard(item) && isLyingFlat(item) ? item.thickness : item.size) / 2;
}

export function itemMaterials(item: ItemDef): THREE.Material | THREE.Material[] {
  if (!isBillboard(item)) {
    return item.faceArt
      ? cubeFaceMaterials(item.faceArt, item.color)
      : new THREE.MeshLambertMaterial({ color: item.color });
  }
  if (!item.sprite) return new THREE.MeshLambertMaterial({ color: item.color });
  return billboardMaterials(item, item.sprite);
}

function billboardMaterials(item: ItemDef, sprite: SpriteArt): THREE.Material[] {
  const rim = new THREE.MeshLambertMaterial({ color: item.edgeColor });
  const art = spriteMaterial(sprite);
  const faces: THREE.Material[] = [rim, rim, rim, rim, rim, rim];
  if (isLyingFlat(item)) {
    faces[TOP] = art;
    faces[BOTTOM] = art;
  } else {
    faces[SOUTH] = art;
    faces[NORTH] = art;
  }
  return faces;
}

export function spriteMaterial(sprite: SpriteArt): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map: spriteTexture(sprite),
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
}

function spriteTexture(sprite: SpriteArt): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = spriteGridSize(sprite);
  paintSpritePixels(canvas.getContext('2d')!, sprite, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
