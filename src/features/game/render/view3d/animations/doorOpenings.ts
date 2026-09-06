import * as THREE from 'three';
import { MAX_FACE_ART_SIZE } from '@/features/asset-library/tiles/tileFaceArt';
import { withTransparency } from '@/features/asset-library/tiles/inkColor';
import { gateLook } from '../../../fixtures/fixtureAppearance';
import { DOOR_FACE_ART, DOOR_STANDS_TALL } from '../../../fixtures/looks/door';
import type { Cell } from '../../../worldRules';
import { coplanarPullOf } from '../coplanarPull';
import { EVERY_FACE } from '../culling/visibleFaceMask';
import { sharedTileBoxGeometry } from '../sharedTileGeometries';
import { tileSurfaceMaterials } from '../tileSurfaces';
import type { WorldAnimation } from './worldAnimations';

export const DOOR_OPENING_SECONDS = 0.6;
const LEAF_OVERHANG = 1.03;
const LINTEL_LANE = 'door opening';

interface OpeningDoor {
  mesh: THREE.Mesh;
  floor: number;
  elapsed: number;
}

export type LeafMaterials = () => THREE.Material | THREE.Material[];

export class DoorOpenings implements WorldAnimation {
  private readonly lifting: OpeningDoor[] = [];

  constructor(
    private readonly root: THREE.Group,
    private readonly elevationAt: (x: number, y: number) => number,
    private readonly leafMaterials: LeafMaterials = closedLeafMaterials,
  ) {}

  open(cells: readonly Cell[]): void {
    for (const cell of cells) this.lifting.push(this.closedLeafAt(cell));
  }

  advance(dtSeconds: number): void {
    for (const door of [...this.lifting]) {
      door.elapsed += dtSeconds;
      if (door.elapsed >= DOOR_OPENING_SECONDS) this.finish(door);
      else liftIntoLintel(door, door.elapsed / DOOR_OPENING_SECONDS);
    }
  }

  dispose(): void {
    for (const door of [...this.lifting]) this.finish(door);
  }

  private closedLeafAt(cell: Cell): OpeningDoor {
    const mesh = new THREE.Mesh(sharedTileBoxGeometry(1, 1, 1, EVERY_FACE), this.leafMaterials());
    mesh.position.set(cell.x + 0.5, 0, cell.y + 0.5);
    this.root.add(mesh);
    const door = { mesh, floor: this.elevationAt(cell.x, cell.y), elapsed: 0 };
    liftIntoLintel(door, 0);
    return door;
  }

  private finish(door: OpeningDoor): void {
    this.root.remove(door.mesh);
    this.lifting.splice(this.lifting.indexOf(door), 1);
  }
}

function leafHeightAt(progress: number): number {
  return DOOR_STANDS_TALL * (1 - progress * progress);
}

function liftIntoLintel(door: OpeningDoor, progress: number): void {
  const height = leafHeightAt(progress);
  door.mesh.scale.set(LEAF_OVERHANG, Math.max(height, 0.001), LEAF_OVERHANG);
  door.mesh.position.y = door.floor + DOOR_STANDS_TALL - height / 2;
}

function closedLeafMaterials(): THREE.Material | THREE.Material[] {
  return tileSurfaceMaterials(
    {
      art: DOOR_FACE_ART.mechanism,
      baseColor: withTransparency(gateLook('mechanism', false).color, false),
      glow: 0,
      drawnFromBothSides: false,
      pull: coplanarPullOf('marker', LINTEL_LANE),
    },
    MAX_FACE_ART_SIZE,
  );
}
