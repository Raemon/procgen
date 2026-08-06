import * as THREE from 'three';
import type { RemoteEntity, RemotePlayers } from '../../net/remotePlayers';
import type { WorldSampler } from '../../procgen/worldSampler';
import { disposeMeshResources } from './disposeMeshResources';
import { EasedPoint } from './easedPoint';

const PLAYER_HEIGHT = 0.55;
const PLAYER_HUES = [0x6ad8ff, 0x8dff6a, 0xff8d6a, 0xd86aff, 0xffe36a, 0x6affc8];
const AGENT_HUE = 0xff6ad8;

export class RemotePlayerMeshes {
  private readonly meshes = new Map<number, THREE.Mesh>();
  private readonly easedPositions = new Map<number, EasedPoint>();
  private readonly group = new THREE.Group();

  constructor(
    root: THREE.Group,
    private readonly sampler: WorldSampler,
  ) {
    root.add(this.group);
  }

  dispose(): void {
    for (const id of [...this.meshes.keys()]) this.dropMesh(id);
    this.group.removeFromParent();
  }

  syncTo(remote: RemotePlayers, dtSeconds: number): void {
    const live = new Set<number>();
    for (const entity of remote.others()) {
      live.add(entity.id);
      this.placeMesh(entity, dtSeconds);
    }
    for (const id of [...this.meshes.keys()]) if (!live.has(id)) this.dropMesh(id);
  }

  private placeMesh(entity: RemoteEntity, dtSeconds: number): void {
    const mesh = this.meshes.get(entity.id) ?? this.addMesh(entity);
    const eased = this.easedPositions.get(entity.id) ?? this.addEasedPosition(entity);
    eased.approach(entity.x, entity.y, dtSeconds);
    const elevation = this.sampler.elevationAt(Math.round(eased.x), Math.round(eased.y));
    mesh.position.set(eased.x + 0.5, elevation + PLAYER_HEIGHT, eased.y + 0.5);
  }

  private addEasedPosition(entity: RemoteEntity): EasedPoint {
    const eased = new EasedPoint(entity.x, entity.y);
    this.easedPositions.set(entity.id, eased);
    return eased;
  }

  private addMesh(entity: RemoteEntity): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.5, 4, 12),
      new THREE.MeshLambertMaterial({ color: hueFor(entity) }),
    );
    this.meshes.set(entity.id, mesh);
    this.group.add(mesh);
    return mesh;
  }

  private dropMesh(id: number): void {
    const mesh = this.meshes.get(id);
    if (!mesh) return;
    this.group.remove(mesh);
    disposeMeshResources(mesh);
    this.meshes.delete(id);
    this.easedPositions.delete(id);
  }
}

function hueFor(entity: RemoteEntity): number {
  if (entity.kind === 'agent') return AGENT_HUE;
  return PLAYER_HUES[entity.id % PLAYER_HUES.length]!;
}
