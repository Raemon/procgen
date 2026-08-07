import * as THREE from 'three';
import type { ReadOnlyCreatureLibrary } from '../../app/readOnlyLibraries';
import type { CreatureDef } from '../../creatures/creatureDef';
import type { CreatureInstance } from '../../creatures/sim/creatureInstance';
import type { CreatureSim } from '../../creatures/sim/creatureSim';
import type { WorldSampler } from '../../procgen/worldSampler';
import { hashString } from '../../random/hashString';
import type { CameraView } from './cameraView';
import { characterQuadMesh, dressCharacterQuad, isCharacterQuad } from './characterQuad';
import { CharacterSpriteTextures } from './characterSpriteTextures';
import { disposeMeshResources } from './disposeMeshResources';
import { cubeFaceMaterials } from './faceArtMaterials';
import { lambertFromInk } from './inkMaterial';

const ANIMATION_SPREAD_SECONDS = 4;

export type { CameraView };

export class CreatureMeshes {
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly group = new THREE.Group();

  constructor(
    root: THREE.Group,
    private readonly library: ReadOnlyCreatureLibrary,
    private readonly sampler: WorldSampler,
    private readonly sprites: CharacterSpriteTextures,
  ) {
    root.add(this.group);
  }

  dispose(): void {
    for (const key of [...this.meshes.keys()]) this.dropMesh(key);
    this.group.removeFromParent();
  }

  forgetSprites(): void {
    for (const key of [...this.meshes.keys()]) this.dropMesh(key);
  }

  syncTo(sim: CreatureSim, view: CameraView): void {
    const live = new Set<string>();
    for (const creature of sim.active()) {
      const def = this.library.byId(creature.creatureId);
      if (!def) continue;
      live.add(creature.key);
      this.placeMesh(creature, def, view);
    }
    for (const key of [...this.meshes.keys()]) if (!live.has(key)) this.dropMesh(key);
  }

  private placeMesh(creature: CreatureInstance, def: CreatureDef, view: CameraView): void {
    const billboarded = this.dressAsCharacter(creature, def, view);
    const mesh = this.meshOf(creature.key, billboarded ? null : def);
    const elevation = this.sampler.elevationAt(Math.round(creature.x), Math.round(creature.y));
    mesh.position.set(creature.x + 0.5, elevation + def.size / 2, creature.y + 0.5);
    if (!billboarded) mesh.scale.setScalar(def.size);
  }

  private dressAsCharacter(
    creature: CreatureInstance,
    def: CreatureDef,
    view: CameraView,
  ): boolean {
    if (!def.billboard) return false;
    return dressCharacterQuad(this.meshOf(creature.key, null), {
      sprites: this.sprites,
      def,
      motion: creature,
      view: { yaw: view.yaw, seconds: animationClock(creature, view) },
    });
  }

  private meshOf(key: string, cubeDef: CreatureDef | null): THREE.Mesh {
    const existing = this.meshes.get(key);
    const wantsCube = cubeDef !== null;
    if (existing && isCharacterQuad(existing) !== wantsCube) return existing;
    if (existing) this.dropMesh(key);
    const mesh = wantsCube ? cubeMesh(cubeDef) : characterQuadMesh();
    this.meshes.set(key, mesh);
    this.group.add(mesh);
    return mesh;
  }

  private dropMesh(key: string): void {
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.group.remove(mesh);
    disposeMeshResources(mesh, { keepMaterials: isCharacterQuad(mesh) });
    this.meshes.delete(key);
  }
}

function animationClock(creature: CreatureInstance, view: CameraView): number {
  const offset = (hashString(creature.key) % 1000) / 1000;
  return view.seconds + offset * ANIMATION_SPREAD_SECONDS;
}

function cubeMesh(def: CreatureDef): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), creatureMaterial(def));
}

function creatureMaterial(def: CreatureDef): THREE.Material | THREE.Material[] {
  if (def.faceArt) return cubeFaceMaterials(def.faceArt, def.color);
  return lambertFromInk(def.color);
}
