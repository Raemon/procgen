import * as THREE from 'three';
import { facingYawRadians } from '../../world/facing';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { CharacterCamera } from './characterCamera';
import { ChunkMeshStreamer } from './chunkMeshStreamer';
import { createDaylitScene, createPlayerMesh } from './daylitScene';
import { FollowCamera } from './followCamera';
import { streamingRadiusChunks } from './streamingRadius';

const MAX_FRAME_MS = 100;
const PLAYER_HEIGHT = 0.55;

export type CameraStyle = 'god' | 'character';

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = createDaylitScene();
  private readonly followCamera = new FollowCamera();
  private readonly characterCamera = new CharacterCamera();
  private cameraStyle: CameraStyle = 'god';
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

  setCameraStyle(style: CameraStyle): void {
    if (this.cameraStyle === style) return;
    this.cameraStyle = style;
    this.characterCamera.snapOnNextFrame();
    this.followCamera.snapToFocusOnNextUpdate();
    this.resize();
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
    listenForWheelZoom(this.canvas, (wheelPixelsY) => {
      if (this.cameraStyle === 'god') this.followCamera.zoomByWheelPixels(wheelPixelsY);
      else this.characterCamera.zoomByWheelPixels(wheelPixelsY);
    });
    listenForDragPan(this.canvas, (dxPixels, dyPixels) => {
      if (this.cameraStyle === 'god') this.followCamera.panByDragPixels(dxPixels, dyPixels);
    });
    this.canvas.addEventListener('dblclick', () => this.recenterOnPlayer());
  }

  private resize(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.renderer.setPixelRatio(devicePixelRatioCapped());
    this.renderer.setSize(size.cssWidth, size.cssHeight);
    this.followCamera.setViewportSize(size.cssWidth, size.cssHeight);
    this.characterCamera.setAspect(size.cssWidth / size.cssHeight);
  }

  private onFrame = (time: number): void => {
    this.renderFrame(Math.min(MAX_FRAME_MS, time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;
    this.animationFrame = requestAnimationFrame(this.onFrame);
  };

  private renderFrame(dtSeconds: number): void {
    if (isCollapsed(containerSize(this.container))) return;
    this.placePlayer();
    this.renderer.render(this.scene, this.updateActiveCamera(dtSeconds));
  }

  private updateActiveCamera(dtSeconds: number): THREE.PerspectiveCamera {
    if (this.cameraStyle === 'god') {
      this.followCamera.update(dtSeconds, this.world.playerX, this.world.playerY);
      const focus = this.followCamera.focusPoint();
      this.streamAround(focus.x, focus.y, this.followCamera.visibleGroundRadiusTiles());
      return this.followCamera.camera;
    }
    this.characterCamera.update(
      dtSeconds,
      this.world.playerX,
      this.world.playerY,
      this.playerElevation(),
      facingYawRadians(this.world.facing),
    );
    const focus = this.characterCamera.focusPoint();
    this.streamAround(focus.x, focus.y, this.characterCamera.visibleGroundRadiusTiles());
    return this.characterCamera.camera;
  }

  private streamAround(x: number, y: number, visibleRadiusTiles: number): void {
    this.streamer.streamAround(x, y, streamingRadiusChunks(visibleRadiusTiles));
  }

  private playerElevation(): number {
    return this.sampler.elevationAt(this.world.playerX, this.world.playerY);
  }

  private placePlayer(): void {
    this.player.position.set(
      this.world.playerX + 0.5,
      this.playerElevation() + PLAYER_HEIGHT,
      this.world.playerY + 0.5,
    );
  }
}
