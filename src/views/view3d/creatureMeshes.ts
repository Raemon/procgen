import * as THREE from 'three';
import type { ReadOnlyCreatureLibrary } from '../../app/readOnlyLibraries';
import type { CreatureDef } from '../../creatures/creatureDef';
import type { CreatureInstance } from '../../creatures/sim/creatureInstance';
import type { CreatureSim } from '../../creatures/sim/creatureSim';
import type { WorldSampler } from '../../procgen/worldSampler';
import { disposeMeshResources } from './disposeMeshResources';
import { cubeFaceMaterials } from './faceArtMaterials';

export class CreatureMeshes {
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly group = new THREE.Group();

  constructor(
    root: THREE.Group,
    private readonly library: ReadOnlyCreatureLibrary,
    private readonly sampler: WorldSampler,
  ) {
    root.add(this.group);
  }

  dispose(): void {
    for (const key of [...this.meshes.keys()]) this.dropMesh(key);
    this.group.removeFromParent();
  }

  syncTo(sim: CreatureSim): void {
    const live = new Set<string>();
    for (const creature of sim.active()) {
      const def = this.library.byId(creature.creatureId);
      if (!def) continue;
      live.add(creature.key);
      this.placeMesh(creature, def);
    }
    for (const key of [...this.meshes.keys()]) if (!live.has(key)) this.dropMesh(key);
  }

  private placeMesh(creature: CreatureInstance, def: CreatureDef): void {
    const mesh = this.meshes.get(creature.key) ?? this.addMesh(creature.key, def);
    const elevation = this.sampler.elevationAt(Math.round(creature.x), Math.round(creature.y));
    mesh.position.set(creature.x + 0.5, elevation + def.size / 2, creature.y + 0.5);
    mesh.scale.setScalar(def.size);
  }

  private addMesh(key: string, def: CreatureDef): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), creatureMaterial(def));
    this.meshes.set(key, mesh);
    this.group.add(mesh);
    return mesh;
  }

  private dropMesh(key: string): void {
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.group.remove(mesh);
    disposeMeshResources(mesh);
    this.meshes.delete(key);
  }
}

function creatureMaterial(def: CreatureDef): THREE.Material | THREE.Material[] {
  if (def.faceArt) return cubeFaceMaterials(def.faceArt, def.color);
  return new THREE.MeshLambertMaterial({ color: def.color });
}
