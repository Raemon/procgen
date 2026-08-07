import * as THREE from 'three';
import { BILLBOARD, LYING_FLAT, type ItemDef } from '../../items/itemDef';
import type { SpriteArt } from '../../world/tiles/spriteArt';
import { cubeFaceMaterials } from './faceArtMaterials';
import { lambertFromInk } from './inkMaterial';
import { spriteMaterial } from './spriteMaterial';

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
      : lambertFromInk(item.color);
  }
  if (!item.sprite) return lambertFromInk(item.color);
  return billboardMaterials(item, item.sprite);
}

function billboardMaterials(item: ItemDef, sprite: SpriteArt): THREE.Material[] {
  const rim = lambertFromInk(item.edgeColor);
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

