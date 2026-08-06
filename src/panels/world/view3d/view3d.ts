import * as THREE from 'three';
import type { WorldSampler } from '../../../procgen/worldSampler';
import type { Tileset } from '../../../world/tiles/tileset';
import type { World } from '../../../world/world';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { ChunkMeshStreamer } from './chunkMeshStreamer';
import { createDaylitScene, createPlayerMesh } from './daylitScene';
import { FollowCamera } from './followCamera';
import { streamingRadiusChunks } from './streamingRadius';

const MAX_FRAME_MS = 100;
const PLAYER_HEIGHT = 0.55;

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = createDaylitScene();
  private readonly followCamera = new FollowCamera();
  private readonly worldGroup = new THREE.Group();
  private readonly player = createPlayerMesh();
  private readonly streamer: ChunkMeshStreamer;
  private readonly resizeObserver = new ResizeObserver(() => this.resize());
  private animationFrame = 0;
  private lastFrameTime = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly sampler: WorldSampler,
    tileset: Tileset,
  ) {
    this.canvas = this.renderer.domElement;
    this.canvas.className = WORLD_CANVAS_CLASSES;
    container.appendChild(this.canvas);
    this.scene.add(this.worldGroup, this.player);
    this.streamer = new ChunkMeshStreamer(this.worldGroup, this.sampler, tileset);
    this.listenForCameraGestures();
    this.resizeObserver.observe(container);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.streamer.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  yawQuadrant(): number {
    return this.followCamera.yawQuadrant();
  }

  rotate(direction: -1 | 1): void {
    this.followCamera.rotate(direction);
  }

  recenterOnPlayer(): void {
    this.followCamera.recenterOnPlayer();
  }

  onWorldChanged(): void {
    this.streamer.invalidateAll();
  }

  private listenForCameraGestures(): void {
    listenForWheelZoom(this.canvas, (wheelPixelsY) =>
      this.followCamera.zoomByWheelPixels(wheelPixelsY),
    );
    listenForDragPan(this.canvas, (dxPixels, dyPixels) =>
      this.followCamera.panByDragPixels(dxPixels, dyPixels),
    );
    this.canvas.addEventListener('dblclick', () => this.recenterOnPlayer());
  }

  private resize(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.renderer.setPixelRatio(devicePixelRatioCapped());
    this.renderer.setSize(size.cssWidth, size.cssHeight);
    this.followCamera.setViewportSize(size.cssWidth, size.cssHeight);
  }

  private onFrame = (time: number): void => {
    this.renderFrame(Math.min(MAX_FRAME_MS, time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;
    this.animationFrame = requestAnimationFrame(this.onFrame);
  };

  private renderFrame(dtSeconds: number): void {
    if (isCollapsed(containerSize(this.container))) return;
    this.placePlayer();
    this.followCamera.update(dtSeconds, this.world.playerX, this.world.playerY);
    this.streamAroundCameraFocus();
    this.renderer.render(this.scene, this.followCamera.camera);
  }

  private streamAroundCameraFocus(): void {
    const focus = this.followCamera.focusPoint();
    this.streamer.streamAround(
      focus.x,
      focus.y,
      streamingRadiusChunks(this.followCamera.visibleGroundRadiusTiles()),
    );
  }

  private placePlayer(): void {
    const elevation = this.sampler.elevationAt(this.world.playerX, this.world.playerY);
    this.player.position.set(
      this.world.playerX + 0.5,
      elevation + PLAYER_HEIGHT,
      this.world.playerY + 0.5,
    );
  }
}
