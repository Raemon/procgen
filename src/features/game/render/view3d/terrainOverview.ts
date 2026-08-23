import * as THREE from 'three';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { isTransparentInk, opaqueInk } from '@/features/asset-library/tiles/inkColor';
import { GROUND_DEPTH, WATER_DROP } from './tileShapes';
import { terrainOverviewCellSpan } from './streamingRadius';

const GRID_RADIUS_CELLS = 5;
const GRID_SIDE_CELLS = GRID_RADIUS_CELLS * 2 + 2;
const MAX_INSTANCES = GRID_SIDE_CELLS * GRID_SIDE_CELLS;
const BUILD_BUDGET_MS_PER_FRAME = 4;
const CELL_OVERLAP = 1.005;
const GROUND_DROP = 0.04;

interface OverviewCell {
  x: number;
  y: number;
  instance: number;
}

interface OverviewSample {
  centerX: number;
  centerY: number;
  elevation: number;
  color: number;
}

export class TerrainOverview {
  private readonly group = new THREE.Group();
  private readonly geometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly material = new THREE.MeshBasicMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  private readonly mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_INSTANCES);
  private readonly samples = new Map<string, OverviewSample | null>();
  private readonly displayed: (OverviewSample | null)[] = new Array(MAX_INSTANCES).fill(null);
  private readonly matrix = new THREE.Matrix4();
  private readonly color = new THREE.Color();
  private pending: OverviewCell[] = [];
  private pendingIndex = 0;
  private cellSpan = 1;
  private gridKey = '';

  constructor(
    root: THREE.Group,
    private readonly sampler: WorldSampler,
    private readonly tileAssets: ReadOnlyTileAssets,
  ) {
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.visible = false;
    this.group.add(this.mesh);
    root.add(this.group);
  }

  syncAround(centerX: number, centerY: number, visibleGroundRadiusTiles: number): void {
    this.group.visible = true;
    const cellSpan = terrainOverviewCellSpan(visibleGroundRadiusTiles);
    const centerCellX = Math.floor(centerX / cellSpan);
    const centerCellY = Math.floor(centerY / cellSpan);
    const minCellX = centerCellX - GRID_RADIUS_CELLS - 1;
    const minCellY = centerCellY - GRID_RADIUS_CELLS - 1;
    const key = `${cellSpan}:${minCellX},${minCellY}`;
    if (key !== this.gridKey) {
      this.configureGrid(
        cellSpan,
        minCellX,
        minCellY,
        centerCellX,
        centerCellY,
        centerX,
        centerY,
      );
      this.gridKey = key;
    }
    this.buildUntilDeadline();
  }

  hide(): void {
    this.group.visible = false;
  }

  invalidate(): void {
    this.samples.clear();
    this.displayed.fill(null);
    this.pending = [];
    this.pendingIndex = 0;
    this.gridKey = '';
    this.mesh.count = 0;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  private configureGrid(
    cellSpan: number,
    minCellX: number,
    minCellY: number,
    centerCellX: number,
    centerCellY: number,
    centerX: number,
    centerY: number,
  ): void {
    if (cellSpan !== this.cellSpan) this.samples.clear();
    this.cellSpan = cellSpan;
    const wanted = new Set<string>();
    const pending: OverviewCell[] = [];
    const seeds = this.seedsAround(centerX, centerY);
    let instance = 0;
    for (let dy = 0; dy < GRID_SIDE_CELLS; dy++) {
      for (let dx = 0; dx < GRID_SIDE_CELLS; dx++) {
        const cell = { x: minCellX + dx, y: minCellY + dy, instance };
        const key = cellKey(cell);
        wanted.add(key);
        if (this.samples.has(key)) {
          const sample = this.samples.get(key) ?? null;
          this.writeSample(instance, sample);
        } else {
          pending.push(cell);
          const cellCenterX = cell.x * cellSpan + cellSpan / 2;
          const cellCenterY = cell.y * cellSpan + cellSpan / 2;
          this.writeSample(instance, {
            ...nearestSample(seeds, cellCenterX, cellCenterY),
            centerX: cellCenterX,
            centerY: cellCenterY,
          });
        }
        instance++;
      }
    }
    for (const key of this.samples.keys()) if (!wanted.has(key)) this.samples.delete(key);
    pending.sort(
      (a, b) =>
        cellDistance(a, centerCellX, centerCellY) -
        cellDistance(b, centerCellX, centerCellY),
    );
    this.mesh.count = MAX_INSTANCES;
    this.pending = pending;
    this.pendingIndex = 0;
    this.markInstancesChanged();
  }

  private seedsAround(centerX: number, centerY: number): OverviewSample[] {
    const seeds = this.displayed.filter(
      (sample): sample is OverviewSample => sample !== null,
    );
    const center = this.sampleAt(Math.floor(centerX), Math.floor(centerY), centerX, centerY);
    if (center) seeds.push(center);
    if (seeds.length === 0) {
      seeds.push({ centerX, centerY, elevation: -GROUND_DROP, color: 0x20252b });
    }
    return seeds;
  }

  private buildUntilDeadline(): void {
    const deadline = performance.now() + BUILD_BUDGET_MS_PER_FRAME;
    let attempted = 0;
    while (
      this.pendingIndex < this.pending.length &&
      (attempted === 0 || performance.now() < deadline)
    ) {
      const cell = this.pending[this.pendingIndex++]!;
      const sample = this.sample(cell);
      this.samples.set(cellKey(cell), sample);
      this.writeSample(cell.instance, sample);
      attempted++;
    }
    if (attempted > 0) this.markInstancesChanged();
  }

  private sample(cell: OverviewCell): OverviewSample | null {
    const minX = cell.x * this.cellSpan;
    const minY = cell.y * this.cellSpan;
    const sampleX = minX + Math.floor(this.cellSpan / 2);
    const sampleY = minY + Math.floor(this.cellSpan / 2);
    return this.sampleAt(
      sampleX,
      sampleY,
      minX + this.cellSpan / 2,
      minY + this.cellSpan / 2,
    );
  }

  private sampleAt(
    sampleX: number,
    sampleY: number,
    centerX: number,
    centerY: number,
  ): OverviewSample | null {
    const tileId = this.sampler.tileAt(sampleX, sampleY);
    if (tileId === EMPTY_TILE) return null;
    const tile = this.tileAssets.byId(tileId);
    if (!tile) return null;
    if (isTransparentInk(tile.color) && tile.faceArt === null && tile.textureId === null) return null;
    const shade = tile.role === 'water' ? 0.7 : 1;
    const elevation =
      this.sampler.elevationAt(sampleX, sampleY) -
      (tile.role === 'water' ? WATER_DROP : 0) -
      GROUND_DROP;
    return {
      centerX,
      centerY,
      elevation,
      color: this.color.set(opaqueInk(tile.color)).multiplyScalar(shade).getHex(),
    };
  }

  private writeSample(index: number, sample: OverviewSample | null): void {
    this.displayed[index] = sample;
    if (!sample) {
      this.matrix.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(index, this.matrix);
      return;
    }
    this.matrix.makeScale(
      this.cellSpan * CELL_OVERLAP,
      GROUND_DEPTH,
      this.cellSpan * CELL_OVERLAP,
    );
    this.matrix.setPosition(
      sample.centerX,
      sample.elevation - GROUND_DEPTH / 2,
      sample.centerY,
    );
    this.mesh.setMatrixAt(index, this.matrix);
    this.mesh.setColorAt(index, this.color.setHex(sample.color));
  }

  private markInstancesChanged(): void {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

function cellKey(cell: OverviewCell): string {
  return `${cell.x},${cell.y}`;
}

function nearestSample(seeds: OverviewSample[], x: number, y: number): OverviewSample {
  let best = seeds[0]!;
  let bestDistance = Infinity;
  for (const seed of seeds) {
    const distance = (seed.centerX - x) ** 2 + (seed.centerY - y) ** 2;
    if (distance < bestDistance) {
      best = seed;
      bestDistance = distance;
    }
  }
  return best;
}

function cellDistance(cell: OverviewCell, centerX: number, centerY: number): number {
  return Math.max(Math.abs(cell.x - centerX), Math.abs(cell.y - centerY));
}
