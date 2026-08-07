import * as THREE from 'three';
import {
  characterFrame,
  frameKey,
  type CharacterMotion,
} from '../../creatures/character/characterFrame';
import type { CreatureDef } from '../../creatures/creatureDef';
import type { CameraView } from './cameraView';
import type { CharacterSpriteTextures } from './characterSpriteTextures';
import { characterQuadFit } from './characterQuadFit';

const UNPAINTED_QUAD = new THREE.MeshLambertMaterial({ visible: false });

export interface CharacterQuadDressing {
  sprites: CharacterSpriteTextures;
  def: CreatureDef;
  motion: CharacterMotion;
  view: CameraView;
  tint?: number;
}

export function characterQuadMesh(): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), UNPAINTED_QUAD);
}

export function isCharacterQuad(mesh: THREE.Mesh): boolean {
  return mesh.geometry.type === 'PlaneGeometry';
}

export function dressCharacterQuad(
  mesh: THREE.Mesh,
  dressing: CharacterQuadDressing,
): number | null {
  const { sprites, def, motion, view, tint } = dressing;
  if (!def.billboard) return null;
  const frame = characterFrame(def.billboard, motion, view.yaw, view.seconds);
  if (!frame) return null;
  const fit = characterQuadFit(def, def.billboard);
  mesh.material = sprites.materialFor(`${def.id}:${frameKey(frame)}`, frame.sprite, tint);
  mesh.rotation.set(0, -view.yaw, 0);
  mesh.scale.set(fit.quadWidth * (frame.mirrored ? -1 : 1), fit.quadHeight, fit.quadWidth);
  return fit.centerHeightAboveFeet;
}
