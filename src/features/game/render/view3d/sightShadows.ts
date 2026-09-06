import * as THREE from 'three';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { ExploredCells } from '../../vision/exploredCells';
import { lineOfSightFrom } from '../../vision/lineOfSight';

const MEMORY_SHADE = 0.25;
const CEILING_HEADROOM_TILES = 8;

export interface ShadowedGround {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  explored: ExploredCells;
}

export class SightShadows {
  private readonly group = new THREE.Group();
  private readonly geometry = flatCellGeometry();
  private readonly unseen = darkMaterial(1);
  private readonly remembered = darkMaterial(1 - MEMORY_SHADE);
  private mesh: THREE.InstancedMesh | null = null;
  private rememberedMesh: THREE.InstancedMesh | null = null;
  private castFrom = '';

  constructor(
    parent: THREE.Object3D,
    private readonly deps: ShadowedGround,
  ) {
    parent.add(this.group);
  }

  dispose(): void {
    this.clear();
    this.group.removeFromParent();
    this.geometry.dispose();
    this.unseen.dispose();
    this.remembered.dispose();
  }

  hide(): void {
    this.group.visible = false;
  }

  invalidate(): void {
    this.castFrom = '';
  }

  castAround(centerX: number, centerY: number, sightRadiusTiles: number, framedTiles: number): void {
    this.group.visible = true;
    const shaded = Math.ceil(Math.max(sightRadiusTiles, framedTiles));
    const from = `${centerX},${centerY},${sightRadiusTiles},${shaded}`;
    if (from === this.castFrom) return;
    this.castFrom = from;
    const sight = lineOfSightFrom(
      this.deps.sampler,
      this.deps.tileAssets,
      { x: centerX, y: centerY },
      sightRadiusTiles,
      this.deps.explored,
    );
    const unseenCells: THREE.Vector2[] = [];
    const rememberedCells: THREE.Vector2[] = [];
    let ceiling = -Infinity;
    for (let dy = -shaded; dy <= shaded; dy++) {
      for (let dx = -shaded; dx <= shaded; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (sight.inSight(x, y)) continue;
        ceiling = Math.max(ceiling, this.deps.sampler.elevationAt(x, y));
        (sight.remembered(x, y) ? rememberedCells : unseenCells).push(new THREE.Vector2(x, y));
      }
    }
    this.clear();
    const height = (Number.isFinite(ceiling) ? ceiling : 0) + CEILING_HEADROOM_TILES;
    this.mesh = this.addLayer(unseenCells, this.unseen, height);
    this.rememberedMesh = this.addLayer(rememberedCells, this.remembered, height);
  }

  private addLayer(
    cells: readonly THREE.Vector2[],
    material: THREE.Material,
    height: number,
  ): THREE.InstancedMesh | null {
    if (cells.length === 0) return null;
    const mesh = new THREE.InstancedMesh(this.geometry, material, cells.length);
    const placed = new THREE.Matrix4();
    cells.forEach((cell, index) =>
      mesh.setMatrixAt(index, placed.makeTranslation(cell.x + 0.5, height, cell.y + 0.5)),
    );
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    return mesh;
  }

  private clear(): void {

    for (const mesh of [this.mesh, this.rememberedMesh]) {
      if (!mesh) continue;
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.mesh = null;
    this.rememberedMesh = null;
  }
}

function flatCellGeometry(): THREE.BufferGeometry {
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);
  return plane;
}

function darkMaterial(opacity: number): THREE.Material {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    side: THREE.DoubleSide,
  });
}
