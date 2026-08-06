import * as THREE from 'three';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import { createDaylitScene, createPlayerMesh } from './daylitScene';
import { FollowCamera } from './followCamera';
import { buildWorldMeshes, disposeMeshChildren } from './worldMeshes';

const MAX_FRAME_MS = 100;
const ZOOM_PER_WHEEL_UNIT = 0.02;
const PLAYER_HEIGHT = 0.55;

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = createDaylitScene();
  private readonly followCamera = new FollowCamera();
  private readonly worldGroup = new THREE.Group();
  private readonly player = createPlayerMesh();
  private readonly resizeObserver = new ResizeObserver(() => this.resize());
  private animationFrame = 0;
  private lastFrameTime = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly tileset: Tileset,
  ) {
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'view3d-canvas';
    container.appendChild(this.canvas);
    this.scene.add(this.worldGroup, this.player);
    this.listenForWheelZoom();
    this.resizeObserver.observe(container);
    this.resize();
    this.rebuildWorldMeshes();
    this.animationFrame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    disposeMeshChildren(this.worldGroup);
    this.renderer.dispose();
    this.canvas.remove();
  }

  yawQuadrant(): number {
    return this.followCamera.yawQuadrant();
  }

  rotate(direction: -1 | 1): void {
    this.followCamera.rotate(direction);
  }

  onGenerated(): void {
    this.rebuildWorldMeshes();
    this.followCamera.snapToFocusOnNextUpdate();
  }

  onTilesetChanged(): void {
    this.rebuildWorldMeshes();
  }

  private rebuildWorldMeshes(): void {
    disposeMeshChildren(this.worldGroup);
    for (const mesh of buildWorldMeshes(this.world.grid, this.tileset)) this.worldGroup.add(mesh);
  }

  private listenForWheelZoom(): void {
    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.followCamera.zoomBy(event.deltaY * ZOOM_PER_WHEEL_UNIT);
      },
      { passive: false },
    );
  }

  private resize(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.renderer.setPixelRatio(devicePixelRatioCapped());
    this.renderer.setSize(size.cssWidth, size.cssHeight);
    this.followCamera.setAspect(size.cssWidth, size.cssHeight);
  }

  private onFrame = (time: number): void => {
    this.renderFrame(Math.min(MAX_FRAME_MS, time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;
    this.animationFrame = requestAnimationFrame(this.onFrame);
  };

  private renderFrame(dtSeconds: number): void {
    if (isCollapsed(containerSize(this.container))) return;
    this.player.position.set(this.world.playerX + 0.5, PLAYER_HEIGHT, this.world.playerY + 0.5);
    this.followCamera.update(dtSeconds, this.world.playerX, this.world.playerY);
    this.renderer.render(this.scene, this.followCamera.camera);
  }
}
