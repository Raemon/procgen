import * as THREE from 'three';
import { EMPTY_VOXEL, voxelAt, type Prefab } from '../../prefabs/prefabDef';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';

const BACKGROUND_INK = '#0d1119';
const ORBIT_PIXELS_PER_RADIAN = 140;
const MIN_PITCH = 0.15;
const MAX_PITCH = 1.4;

export class PrefabPreviewScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  private readonly voxelGroup = new THREE.Group();
  private yaw = Math.PI / 5;
  private pitch = 0.7;
  private radius = 12;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.scene.background = new THREE.Color(BACKGROUND_INK);
    this.scene.add(new THREE.AmbientLight(0xbfd0e0, 0.7), sunlight(), this.voxelGroup);
    this.listenForOrbitDrag();
  }

  dispose(): void {
    this.clearVoxels();
    this.renderer.dispose();
  }

  showPrefab(prefab: Prefab, tileset: ReadOnlyTileset): void {
    this.clearVoxels();
    this.voxelGroup.add(...voxelMeshes(prefab, tileset));
    this.voxelGroup.position.set(-prefab.width / 2, 0, -prefab.depth / 2);
    this.radius = Math.max(prefab.width, prefab.depth, prefab.layers) * 2.2;
    this.render();
  }

  render(): void {
    this.sizeToCanvas();
    this.placeCamera();
    this.renderer.render(this.scene, this.camera);
  }

  private listenForOrbitDrag(): void {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.canvas.addEventListener('pointerdown', (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      this.orbitBy(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
      this.render();
    });
    const end = (): void => {
      dragging = false;
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
  }

  private orbitBy(dxPixels: number, dyPixels: number): void {
    this.yaw -= dxPixels / ORBIT_PIXELS_PER_RADIAN;
    this.pitch = Math.min(
      MAX_PITCH,
      Math.max(MIN_PITCH, this.pitch + dyPixels / ORBIT_PIXELS_PER_RADIAN),
    );
  }

  private sizeToCanvas(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private placeCamera(): void {
    this.camera.position.set(
      Math.sin(this.yaw) * Math.cos(this.pitch) * this.radius,
      Math.sin(this.pitch) * this.radius,
      Math.cos(this.yaw) * Math.cos(this.pitch) * this.radius,
    );
    this.camera.lookAt(0, this.radius / 6, 0);
  }

  private clearVoxels(): void {
    for (const child of [...this.voxelGroup.children]) {
      this.voxelGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
  }
}

function voxelMeshes(prefab: Prefab, tileset: ReadOnlyTileset): THREE.Mesh[] {
  const byColor = new Map<string, THREE.Vector3[]>();
  for (let layer = 0; layer < prefab.layers; layer++) {
    for (let y = 0; y < prefab.depth; y++) {
      for (let x = 0; x < prefab.width; x++) {
        collectVoxel(byColor, prefab, tileset, x, y, layer);
      }
    }
  }
  return [...byColor].map(([color, positions]) => instancedBoxes(color, positions));
}

function collectVoxel(
  byColor: Map<string, THREE.Vector3[]>,
  prefab: Prefab,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
  layer: number,
): void {
  const tileId = voxelAt(prefab, x, y, layer);
  if (tileId === EMPTY_VOXEL) return;
  const color = tileset.byId(tileId)?.color ?? '#888888';
  const positions = byColor.get(color) ?? [];
  positions.push(new THREE.Vector3(x + 0.5, layer + 0.5, y + 0.5));
  byColor.set(color, positions);
}

function instancedBoxes(color: string, positions: THREE.Vector3[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.96, 0.96, 0.96),
    new THREE.MeshLambertMaterial({ color }),
    positions.length,
  );
  positions.forEach((position, index) => {
    mesh.setMatrixAt(index, new THREE.Matrix4().setPosition(position));
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function sunlight(): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.5);
  sun.position.set(10, 20, 8);
  return sun;
}
