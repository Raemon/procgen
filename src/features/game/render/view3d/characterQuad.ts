import * as THREE from 'three';
import {
  characterFrame,
  frameKey,
  type CharacterFrame,
  type CharacterMotion,
} from '@/features/asset-library/characters/characterFrame';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { CameraView } from './cameraView';
import type { CharacterSpriteAssets } from './characterSpriteAssets';
import { characterQuadFit, type CharacterQuadFit } from './characterQuadFit';

const UNPAINTED_QUAD = new THREE.MeshLambertMaterial({ visible: false });
const UNPAINTED_SLAB = new THREE.PlaneGeometry(1, 1);

export interface CharacterQuadDressing {
  sprites: CharacterSpriteAssets;
  def: CreatureDef;
  motion: CharacterMotion;
  view: CameraView;
  tint?: number;
}

export function characterQuadMesh(): THREE.Mesh {
  const mesh = new THREE.Mesh(UNPAINTED_SLAB, UNPAINTED_QUAD);
  mesh.userData.characterQuad = true;
  return mesh;
}

export function isCharacterQuad(mesh: THREE.Mesh): boolean {
  return mesh.userData.characterQuad === true;
}

export function dressCharacterQuad(
  mesh: THREE.Mesh,
  dressing: CharacterQuadDressing,
): number | null {
  const { def, motion, view } = dressing;
  if (!def.billboard) return null;
  const frame = characterFrame(def.billboard, motion, view.yaw, view.seconds);
  if (!frame) return null;
  const fit = characterQuadFit(def, def.billboard);
  paintSlab(mesh, dressing, frame);
  poseSlab(mesh, view, fit, frame.mirrored);
  return fit.centerHeightAboveFeet;
}

function paintSlab(mesh: THREE.Mesh, dressing: CharacterQuadDressing, frame: CharacterFrame): void {
  const { sprites, def, tint } = dressing;
  const key = `${def.id}:${frameKey(frame)}`;
  mesh.geometry = sprites.slabs.slabFor(key, frame.sprite);
  mesh.material = [sprites.textures.materialFor(key, frame.sprite, tint), sprites.textures.rimFor(tint)];
}

function poseSlab(
  mesh: THREE.Mesh,
  view: CameraView,
  fit: CharacterQuadFit,
  mirrored: boolean,
): void {
  mesh.rotation.set(0, -view.yaw, 0);
  mesh.scale.set(fit.quadWidth * (mirrored ? -1 : 1), fit.quadHeight, fit.quadWidth);
}
