import * as THREE from 'three';
import type { ReadOnlyItemAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { ItemDef } from '@/features/asset-library/items/itemDef';
import type { ItemSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { instancedItemMesh, type ItemStandingPoint } from './instancedItemMesh';
import { itemHalfHeight } from './itemMeshBuild';
import { itemSurface } from './itemSurfaces';

export class ItemMeshes {
  private readonly meshes = new Map<number, THREE.InstancedMesh>();
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
    this.clear();
    for (const [itemId, itemSpawns] of spawnsByItemId(spawns)) {
      const item = this.itemAssets.byId(itemId);
      if (item) this.addInstances(item, itemSpawns);
    }
  }

  private addInstances(item: ItemDef, spawns: readonly ItemSpawn[]): void {
    const mesh = instancedItemMesh(
      itemSurface(item),
      spawns.map((spawn) => this.standingPointOf(item, spawn)),
    );
    this.meshes.set(item.id, mesh);
    this.group.add(mesh);
  }

  private standingPointOf(item: ItemDef, spawn: ItemSpawn): ItemStandingPoint {
    return {
      x: spawn.x + 0.5,
      y: this.sampler.elevationAt(spawn.x, spawn.y) + item.hover + itemHalfHeight(item),
      z: spawn.y + 0.5,
    };
  }

  private clear(): void {
    for (const mesh of this.meshes.values()) {
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.meshes.clear();
  }
}

function spawnsByItemId(spawns: readonly ItemSpawn[]): Map<number, ItemSpawn[]> {
  const grouped = new Map<number, ItemSpawn[]>();
  for (const spawn of spawns) {
    const forItem = grouped.get(spawn.itemId) ?? [];
    if (forItem.length === 0) grouped.set(spawn.itemId, forItem);
    forItem.push(spawn);
  }
  return grouped;
}

function rectAround(centerX: number, centerY: number, radiusTiles: number) {
  const radius = Math.max(1, Math.round(radiusTiles));
  const x = Math.round(centerX);
  const y = Math.round(centerY);
  return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
}
