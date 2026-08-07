import * as THREE from 'three';
import {
  characterFrame,
  frameKey,
  type CharacterMotion,
} from '../../creatures/character/characterFrame';
import type { CreatureDef } from '../../creatures/creatureDef';
import type { CameraView } from './cameraView';
import type { CharacterSpriteTextures } from './characterSpriteTextures';

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

export function dressCharacterQuad(mesh: THREE.Mesh, dressing: CharacterQuadDressing): boolean {
  const { sprites, def, motion, view, tint } = dressing;
  if (!def.billboard) return false;
  const frame = characterFrame(def.billboard, motion, view.yaw, view.seconds);
  if (!frame) return false;
  mesh.material = sprites.materialFor(`${def.id}:${frameKey(frame)}`, frame.sprite, tint);
  mesh.rotation.set(0, -view.yaw, 0);
  mesh.scale.set(def.size * (frame.mirrored ? -1 : 1), def.size, def.size);
  return true;
}
