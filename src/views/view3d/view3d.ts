import * as THREE from 'three';
import { facingYawRadians } from '../../world/facing';
import { listenForCaptureDrag } from '../../world/capture/listenForCaptureDrag';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import type { WorldViewDeps } from '../worldViewDeps';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { CharacterCamera } from './characterCamera';
import { ChunkMeshStreamer } from './chunkMeshStreamer';
import { CreatureMeshes } from './creatureMeshes';
import { createDaylitScene, createPlayerMesh } from './daylitScene';
import { FollowCamera } from './followCamera';
import { worldCellUnderPointer } from './pointerToWorldCell';
import { SelectionBox } from './selectionBox';
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
  private readonly creatureMeshes: CreatureMeshes;
  private readonly selectionBox: SelectionBox;
  private readonly resizeObserver = new ResizeObserver(() => this.resize());
  private animationFrame = 0;
  private lastFrameTime = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly deps: WorldViewDeps,
  ) {
    this.canvas = this.renderer.domElement;
    this.canvas.className = WORLD_CANVAS_CLASSES;
    container.appendChild(this.canvas);
    this.scene.add(this.worldGroup, this.player);
    this.streamer = new ChunkMeshStreamer(this.worldGroup, deps.sampler, deps.tileset);
    this.creatureMeshes = new CreatureMeshes(this.worldGroup, deps.creatures, deps.sampler);
    this.selectionBox = new SelectionBox(this.worldGroup);
    this.listenForCameraGestures();
    listenForCaptureDrag(this.canvas, deps.capture, (x, y) => this.cellAtPixel(x, y));
    this.resizeObserver.observe(container);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.creatureMeshes.dispose();
    this.selectionBox.dispose();
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

  private activeCamera(): THREE.PerspectiveCamera {
    return this.cameraStyle === 'god' ? this.followCamera.camera : this.characterCamera.camera;
  }

  private cellAtPixel(offsetX: number, offsetY: number) {
    return worldCellUnderPointer(
      this.activeCamera(),
      this.canvas,
      offsetX,
      offsetY,
      this.focusGroundHeight(),
    );
  }

  private focusPoint(): { x: number; y: number } {
    return this.cameraStyle === 'god'
      ? this.followCamera.focusPoint()
      : this.characterCamera.focusPoint();
  }

  private focusGroundHeight(): number {
    const focus = this.focusPoint();
    return this.deps.sampler.elevationAt(Math.floor(focus.x), Math.floor(focus.y));
  }

  private listenForCameraGestures(): void {
    listenForWheelZoom(this.canvas, (wheelPixelsY) => {
      if (this.cameraStyle === 'god') this.followCamera.zoomByWheelPixels(wheelPixelsY);
      else this.characterCamera.zoomByWheelPixels(wheelPixelsY);
    });
    listenForDragPan(
      this.canvas,
      (dxPixels, dyPixels) => {
        if (this.cameraStyle === 'god') this.followCamera.panByDragPixels(dxPixels, dyPixels);
      },
      () => !this.deps.capture.isActive(),
    );
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
    this.creatureMeshes.syncTo(this.deps.sim);
    this.selectionBox.showRegion(this.deps.capture.selectedRegion(), this.focusGroundHeight());
    this.updateActiveCamera(dtSeconds);
    this.streamAroundCameraFocus();
    this.renderer.render(this.scene, this.activeCamera());
  }

  private updateActiveCamera(dtSeconds: number): void {
    const { world } = this.deps;
    if (this.cameraStyle === 'god') {
      this.followCamera.update(dtSeconds, world.playerX, world.playerY);
      return;
    }
    this.characterCamera.update(
      dtSeconds,
      world.playerX,
      world.playerY,
      this.deps.sampler.elevationAt(world.playerX, world.playerY),
      facingYawRadians(world.facing),
    );
  }

  private streamAroundCameraFocus(): void {
    const focus = this.focusPoint();
    const radiusTiles =
      this.cameraStyle === 'god'
        ? this.followCamera.visibleGroundRadiusTiles()
        : this.characterCamera.visibleGroundRadiusTiles();
    this.streamer.streamAround(focus.x, focus.y, streamingRadiusChunks(radiusTiles));
  }

  private placePlayer(): void {
    const elevation = this.deps.sampler.elevationAt(this.deps.world.playerX, this.deps.world.playerY);
    this.player.position.set(
      this.deps.world.playerX + 0.5,
      elevation + PLAYER_HEIGHT,
      this.deps.world.playerY + 0.5,
    );
  }
}
