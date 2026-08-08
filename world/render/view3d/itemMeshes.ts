import * as THREE from 'three';
import type { ReadOnlyItemAssets } from '../../../frontend/readOnlyAssets';
import type { ItemDef } from '../../../assets/items/itemDef';
import type { ItemSpawn, WorldSampler } from '../../../procgen/worldSampler';
import { disposeMeshResources } from './disposeMeshResources';
import { itemGeometry, itemHalfHeight, itemMaterials } from './itemMeshBuild';

export class ItemMeshes {
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly group = new THREE.Group();
  private lastRect = '';

  constructor(
    root: THREE.Group,
    private readonly itemAssets: ReadOnlyItemAssets,
    private readonly sampler: WorldSampler,
  ) {
    root.add(this.group);
  }

  dispose(): void {
    this.clear();
    this.group.removeFromParent();
  }

  invalidate(): void {
    this.lastRect = '';
    this.clear();
  }

  syncAround(centerX: number, centerY: number, radiusTiles: number): void {
    const rect = rectAround(centerX, centerY, radiusTiles);
    const key = `${rect.minX},${rect.minY},${rect.maxX},${rect.maxY}`;
    if (key === this.lastRect) return;
    this.lastRect = key;
    this.showSpawns(this.sampler.itemSpawnsIn(rect.minX, rect.minY, rect.maxX, rect.maxY));
  }

  private showSpawns(spawns: readonly ItemSpawn[]): void {
    const live = new Set<string>();
    for (const spawn of spawns) {
      const item = this.itemAssets.byId(spawn.itemId);
      if (!item) continue;
      const key = `${spawn.x},${spawn.y},${spawn.itemId}`;
      live.add(key);
      if (!this.meshes.has(key)) this.addMesh(key, item, spawn);
    }
    for (const key of [...this.meshes.keys()]) if (!live.has(key)) this.dropMesh(key);
  }

  private addMesh(key: string, item: ItemDef, spawn: ItemSpawn): void {
    const mesh = new THREE.Mesh(itemGeometry(item), itemMaterials(item));
    const elevation = this.sampler.elevationAt(spawn.x, spawn.y);
    mesh.position.set(spawn.x + 0.5, elevation + item.hover + itemHalfHeight(item), spawn.y + 0.5);
    this.meshes.set(key, mesh);
    this.group.add(mesh);
  }

  private dropMesh(key: string): void {
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.group.remove(mesh);
    disposeMeshResources(mesh);
    this.meshes.delete(key);
  }

  private clear(): void {
    for (const key of [...this.meshes.keys()]) this.dropMesh(key);
  }
}

function rectAround(centerX: number, centerY: number, radiusTiles: number) {
  const radius = Math.max(1, Math.round(radiusTiles));
  const x = Math.round(centerX);
  const y = Math.round(centerY);
  return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
}
