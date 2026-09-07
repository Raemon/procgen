import * as THREE from 'three';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { blockLayersOfTile } from '@/features/asset-library/tiles/tileHeight';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { ExploredCells } from '../../vision/exploredCells';
import { lineOfSightFrom } from '../../vision/lineOfSight';
import { tileStandsAsSolidBlock } from './tilePlacements';

const MEMORY_SHADE = 0.25;
const CEILING_HEADROOM_TILES = 8;

export interface ShadowedGround {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  explored: ExploredCells;
}

interface ShadedColumn {
  x: number;
  y: number;
  surface: number;
  foot: number;
}

export class SightShadows {
  private readonly group = new THREE.Group();
  private readonly geometry = columnGeometry();
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
    const unseenColumns: ShadedColumn[] = [];
    const rememberedColumns: ShadedColumn[] = [];
    let ceiling = -Infinity;
    for (let dy = -shaded; dy <= shaded; dy++) {
      for (let dx = -shaded; dx <= shaded; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (sight.inSight(x, y)) continue;
        const surface = this.surfaceOf(x, y);
        ceiling = Math.max(ceiling, surface);
        const column = { x, y, surface, foot: this.exposedFootOf(x, y, surface) };
        (sight.remembered(x, y) ? rememberedColumns : unseenColumns).push(column);
      }
    }
    this.clear();
    const height = (Number.isFinite(ceiling) ? ceiling : 0) + CEILING_HEADROOM_TILES;
    this.mesh = this.addLayer(unseenColumns, this.unseen, height);
    this.rememberedMesh = this.addLayer(rememberedColumns, this.remembered, height);
  }

  private surfaceOf(x: number, y: number): number {
    const elevation = this.deps.sampler.elevationAt(x, y);
    const tileId = this.deps.sampler.tileAt(x, y);
    if (tileId === EMPTY_TILE) return elevation;
    const tile = this.deps.tileAssets.byId(tileId);
    if (!tile || !tileStandsAsSolidBlock(tile)) return elevation;
    return elevation + blockLayersOfTile(tile);
  }

  private exposedFootOf(x: number, y: number, surface: number): number {
    const beside = [
      this.surfaceOf(x + 1, y),
      this.surfaceOf(x - 1, y),
      this.surfaceOf(x, y + 1),
      this.surfaceOf(x, y - 1),
    ];
    return Math.min(surface, ...beside);
  }

  private addLayer(
    columns: readonly ShadedColumn[],
    material: THREE.Material,
    ceiling: number,
  ): THREE.InstancedMesh | null {
    if (columns.length === 0) return null;
    const mesh = new THREE.InstancedMesh(this.geometry, material, columns.length);
    const placed = new THREE.Matrix4();
    const stretched = new THREE.Matrix4();
    columns.forEach((column, index) => {
      const standing = Math.max(0.01, ceiling - column.foot);
      placed.makeTranslation(column.x + 0.5, column.foot, column.y + 0.5);
      mesh.setMatrixAt(index, placed.multiply(stretched.makeScale(1, standing, 1)));
    });
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

function columnGeometry(): THREE.BufferGeometry {
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  return box;
}

function darkMaterial(opacity: number): THREE.Material {
  return new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    side: THREE.FrontSide,
  });
}
