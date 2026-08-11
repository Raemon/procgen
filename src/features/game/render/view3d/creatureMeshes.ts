import * as THREE from 'three';
import type { ReadOnlyCreatureAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { CreatureInstance } from '../../creatureSim/creatureInstance';
import type { CreatureSim } from '../../creatureSim/creatureSim';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { hashString } from '@/features/asset-library/worlds/random/hashString';
import type { CameraView } from './cameraView';
import { characterQuadMesh, dressCharacterQuad, isCharacterQuad } from './characterQuad';
import { CharacterSpriteAssets } from './characterSpriteAssets';
import { creatureBodyGeometry, creatureBodyMaterials } from './creatureSurfaces';

const ANIMATION_SPREAD_SECONDS = 4;

export type { CameraView };

export class CreatureMeshes {
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly group = new THREE.Group();

  constructor(
    root: THREE.Group,
    private readonly creatureAssets: ReadOnlyCreatureAssets,
    private readonly sampler: WorldSampler,
    private readonly sprites: CharacterSpriteAssets,
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
      const def = this.creatureAssets.byId(creature.creatureId);
      if (!def) continue;
      live.add(creature.key);
      this.placeMesh(creature, def, view);
    }
    for (const key of [...this.meshes.keys()]) if (!live.has(key)) this.dropMesh(key);
  }

  private placeMesh(creature: CreatureInstance, def: CreatureDef, view: CameraView): void {
    const billboardedCenterHeight = this.dressAsCharacter(creature, def, view);
    const cubed = billboardedCenterHeight === null;
    const mesh = this.meshOf(creature.key, cubed ? def : null);
    const elevation = this.sampler.elevationAt(Math.round(creature.x), Math.round(creature.y));
    const centerHeight = billboardedCenterHeight ?? def.bodyHeight / 2;
    mesh.position.set(creature.x + 0.5, elevation + centerHeight, creature.y + 0.5);
    if (cubed) mesh.scale.set(def.bodyWidth, def.bodyHeight, def.bodyWidth);
  }

  private dressAsCharacter(
    creature: CreatureInstance,
    def: CreatureDef,
    view: CameraView,
  ): number | null {
    if (!def.billboard) return null;
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
    this.meshes.delete(key);
  }
}

function animationClock(creature: CreatureInstance, view: CameraView): number {
  const offset = (hashString(creature.key) % 1000) / 1000;
  return view.seconds + offset * ANIMATION_SPREAD_SECONDS;
}

function cubeMesh(def: CreatureDef): THREE.Mesh {
  return new THREE.Mesh(creatureBodyGeometry(), creatureBodyMaterials(def));
}
