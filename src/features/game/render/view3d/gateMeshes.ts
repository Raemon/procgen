import * as THREE from 'three';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import {
  GRILLE_TRAVEL,
  portcullisFrameBoxes,
  portcullisGrilleBoxes,
  type PortcullisBox,
} from './portcullisBoxes';

export interface GateSighting {
  key: string;
  openness: number;
}

interface StandingGate {
  group: THREE.Group;
  grille: THREE.Group;
}

interface TileRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const sharedBox = new THREE.BoxGeometry(1, 1, 1);
const stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x59544b });
const ironMaterial = new THREE.MeshLambertMaterial({ color: 0x363d47 });

export function gateKeyAt(x: number, y: number): string {
  return `${x},${y}`;
}

export class GateMeshes {
  private readonly group = new THREE.Group();
  private readonly gates = new Map<string, StandingGate>();
  private sighted: GateSighting[] = [];
  private lastRect = '';

  constructor(
    root: THREE.Group,
    private readonly sampler: WorldSampler,
    private readonly extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
  ) {
    root.add(this.group);
  }

  dispose(): void {
    this.clear();
    this.group.removeFromParent();
  }

  invalidate(): void {
    this.clear();
  }

  standAround(centerX: number, centerY: number, radiusTiles: number): readonly GateSighting[] {
    const rect = rectAround(centerX, centerY, radiusTiles);
    const key = `${rect.minX},${rect.minY},${rect.maxX},${rect.maxY}`;
    if (key === this.lastRect) return this.sighted;
    this.lastRect = key;
    const markers = this.gateMarkersIn(rect);
    this.standAllOf(markers);
    this.sighted = markers.map((marker) => ({
      key: gateKeyOf(marker),
      openness: marker.gateOpenness ?? 0,
    }));
    return this.sighted;
  }

  standingKeys(): ReadonlySet<string> {
    return new Set(this.gates.keys());
  }

  slideEach(slideOf: (key: string) => number): void {
    for (const [key, gate] of this.gates) gate.grille.position.y = -GRILLE_TRAVEL * slideOf(key);
  }

  private gateMarkersIn(rect: TileRect): Marker[] {
    return [
      ...this.sampler.markersIn(rect.minX, rect.minY, rect.maxX, rect.maxY),
      ...this.extraMarkers.markersIn(rect.minX, rect.minY, rect.maxX, rect.maxY),
    ].filter((marker) => marker.gateOpenness !== undefined);
  }

  private standAllOf(markers: readonly Marker[]): void {
    const wanted = markers.map(gateKeyOf).sort().join(' ');
    if (wanted === [...this.gates.keys()].sort().join(' ')) return;
    this.clearMeshes();
    for (const marker of markers) this.stand(marker);
  }

  private stand(marker: Marker): void {
    const elevation = this.sampler.elevationAt(marker.x, marker.y);
    const group = new THREE.Group();
    group.position.set(marker.x + 0.5, elevation, marker.y + 0.5);
    group.rotation.y = this.gateTurn(marker.x, marker.y, elevation);
    const grille = new THREE.Group();
    grille.add(boxesMesh(portcullisGrilleBoxes(), ironMaterial));
    group.add(boxesMesh(portcullisFrameBoxes(), stoneMaterial), grille);
    this.group.add(group);
    this.gates.set(gateKeyOf(marker), { group, grille });
  }

  private gateTurn(x: number, y: number, elevation: number): number {
    const blocked = (dx: number, dy: number) => this.sampler.elevationAt(x + dx, y + dy) > elevation;
    return blocked(1, 0) && blocked(-1, 0) ? 0 : Math.PI / 2;
  }

  private clear(): void {
    this.clearMeshes();
    this.sighted = [];
    this.lastRect = '';
  }

  private clearMeshes(): void {
    for (const gate of this.gates.values()) {
      this.group.remove(gate.group);
      gate.group.traverse(disposeInstances);
    }
    this.gates.clear();
  }
}

function gateKeyOf(marker: Marker): string {
  return gateKeyAt(marker.x, marker.y);
}

function rectAround(centerX: number, centerY: number, radiusTiles: number): TileRect {
  const radius = Math.max(1, Math.round(radiusTiles));
  const [x, y] = [Math.round(centerX), Math.round(centerY)];
  return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
}

function boxesMesh(boxes: readonly PortcullisBox[], material: THREE.Material): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(sharedBox, material, boxes.length);
  const place = new THREE.Matrix4();
  const scale = new THREE.Matrix4();
  boxes.forEach((box, index) => {
    place.makeTranslation(box.x, box.y, box.z);
    scale.makeScale(box.width, box.height, box.depth);
    mesh.setMatrixAt(index, place.multiply(scale));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

function disposeInstances(object: THREE.Object3D): void {
  if (object instanceof THREE.InstancedMesh) object.dispose();
}
