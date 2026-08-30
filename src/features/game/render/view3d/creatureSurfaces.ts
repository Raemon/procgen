import * as THREE from 'three';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { coplanarLane, coplanarPullOf, pullTowardCamera } from './coplanarPull';
import { disposeMaterials } from './disposeMeshResources';
import { cubeFaceMaterials } from './faceArtMaterials';
import { lambertFromInk } from './inkMaterial';

const BODY_BOX = new THREE.BoxGeometry(1, 1, 1);
const materialsByCreatureId = new Map<number, THREE.Material | THREE.Material[]>();

export function creatureBodyGeometry(): THREE.BufferGeometry {
  return BODY_BOX;
}

export function creatureBodyMaterials(def: CreatureDef): THREE.Material | THREE.Material[] {
  const cached = materialsByCreatureId.get(def.id);
  if (cached) return cached;
  const materials = builtBodyMaterials(def);
  pullTowardCamera(materials, coplanarPullOf('character', coplanarLane(def.id)));
  materialsByCreatureId.set(def.id, materials);
  return materials;
}

export function disposeSharedCreatureSurfaces(): void {
  for (const materials of materialsByCreatureId.values()) disposeMaterials(materials);
  materialsByCreatureId.clear();
}

function builtBodyMaterials(def: CreatureDef): THREE.Material | THREE.Material[] {
  return def.faceArt ? cubeFaceMaterials(def.faceArt, def.color) : lambertFromInk(def.color);
}
