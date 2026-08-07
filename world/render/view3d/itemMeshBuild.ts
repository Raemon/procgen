import * as THREE from 'three';
import { BILLBOARD, LYING_FLAT, type ItemDef } from '../../../library/items/itemDef';
import { dominantPixelColor } from '../../../library/tiles/dominantFaceColor';
import type { SpriteArt } from '../../../library/tiles/spriteArt';
import { cubeFaceMaterials } from './faceArtMaterials';
import { lambertFromInk } from './inkMaterial';
import { glowOfEmitter, glowSelfLit } from './selfLitGlow';
import { spriteRimMaterial } from './spriteRimMaterial';
import { spriteSlabGeometry } from './spriteSlabGeometry';
import { spriteMaterial, spriteTexture } from './spriteMaterial';

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

export function itemGeometry(item: ItemDef): THREE.BufferGeometry {
  if (!isBillboard(item)) return new THREE.BoxGeometry(item.size, item.size, item.size);
  if (!item.sprite) return billboardBox(item);
  return orientedSlab(item, item.sprite);
}

function billboardBox(item: ItemDef): THREE.BoxGeometry {
  return isLyingFlat(item)
    ? new THREE.BoxGeometry(item.size, item.thickness, item.size)
    : new THREE.BoxGeometry(item.size, item.size, item.thickness);
}

function orientedSlab(item: ItemDef, sprite: SpriteArt): THREE.BufferGeometry {
  const slab = spriteSlabGeometry(sprite, {
    width: item.size,
    height: item.size,
    depth: item.thickness,
  });
  if (isLyingFlat(item)) slab.rotateX(-Math.PI / 2);
  return slab;
}

export function itemHalfHeight(item: ItemDef): number {
  return (isBillboard(item) && isLyingFlat(item) ? item.thickness : item.size) / 2;
}

export function itemMaterials(item: ItemDef): THREE.Material | THREE.Material[] {
  const surfaces = itemSurfaces(item);
  glowSelfLit(surfaces, glowOfEmitter(item), rimGlowInk(item));
  return surfaces;
}

function rimGlowInk(item: ItemDef): string | undefined {
  return item.sprite ? dominantPixelColor(item.sprite) ?? undefined : undefined;
}

function itemSurfaces(item: ItemDef): THREE.Material | THREE.Material[] {
  if (!isBillboard(item)) {
    return item.faceArt
      ? cubeFaceMaterials(item.faceArt, item.color)
      : lambertFromInk(item.color);
  }
  return item.sprite ? slabMaterials(item.sprite) : boxBillboardMaterials(item);
}

function slabMaterials(sprite: SpriteArt): THREE.Material[] {
  return [spriteMaterial(spriteTexture(sprite)), spriteRimMaterial()];
}

function boxBillboardMaterials(item: ItemDef): THREE.Material[] {
  const rim = lambertFromInk(item.edgeColor);
  const face = lambertFromInk(item.color);
  const faces: THREE.Material[] = [rim, rim, rim, rim, rim, rim];
  if (isLyingFlat(item)) {
    faces[TOP] = face;
    faces[BOTTOM] = face;
  } else {
    faces[SOUTH] = face;
    faces[NORTH] = face;
  }
  return faces;
}
