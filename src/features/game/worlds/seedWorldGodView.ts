import * as THREE from 'three';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { NO_EXTRA_MARKERS } from '../render/markerSource';
import { containerSize, isCollapsed, sizeCanvasToContainer } from '../render/canvasSurface';
import type { FramedCamera } from '../render/view3d/framedCamera';
import { godFramedCamera } from '../render/view3d/godFramedCamera';
import { ChunkMeshStreamer } from '../render/view3d/chunkMeshStreamer';
import { OVERHEAD_AMBIENT, SceneDaylight } from '../render/view3d/sceneDaylight';
import { streamingRadiusChunks } from '../render/view3d/streamingRadius';
import { tileLightsOnlyDeps } from '../render/view3d/tileLightsOnlyDeps';
import { createWorldScene } from '../render/view3d/worldScene';
import { WorldLights } from '../render/view3d/worldLights';
import type { SeedWorld } from './seedWorld';
import { acquireSharedGodPreviewRenderer, type SharedGodPreviewRenderer } from './sharedGodPreviewRenderer';

const GOD_DISTANCE_AT_UNIT_ZOOM = 16;
const PREVIEW_FACING = 1;

export class SeedWorldGodView {
  readonly canvas = document.createElement('canvas');
  private readonly scene = createWorldScene();
  private readonly daylight = new SceneDaylight(this.scene, OVERHEAD_AMBIENT);
  private readonly chunkGroups = new THREE.Group();
  private readonly streamer: ChunkMeshStreamer;
  private readonly lights: WorldLights;
  private readonly resizeObserver: ResizeObserver;
  private readonly shared: SharedGodPreviewRenderer;
  private framed: FramedCamera;
  private width = 1;
  private height = 1;

  constructor(
    private readonly container: HTMLElement,
    private world: SeedWorld,
    tileAssets: ReadOnlyTileAssets,
    private zoom: number,
  ) {
    this.canvas.className = 'block h-full w-full';
    container.appendChild(this.canvas);
    this.scene.add(this.chunkGroups);
    this.streamer = new ChunkMeshStreamer(
      this.chunkGroups,
      world.sampler,
      tileAssets,
      NO_EXTRA_MARKERS,
    );
    this.lights = new WorldLights(this.scene, tileLightsOnlyDeps({ sampler: world.sampler, tileAssets }));
    this.framed = this.cameraForSize(1, 1);
    this.shared = acquireSharedGodPreviewRenderer();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.shared.add(this);
  }

  setWorld(world: SeedWorld): void {
    this.world = world;
    this.streamer.invalidateAll();
    this.lights.invalidate();
    this.framed = this.cameraForSize(this.width, this.height);
    this.shared.requestPaint();
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.framed = this.cameraForSize(this.width, this.height);
    this.shared.requestPaint();
  }

  streamFrame(): void {
    if (this.width < 2 || this.height < 2) return;
    this.daylight.setLevel(this.world.store.daylight());
    this.framed.update();
    const focus = this.framed.focusPoint();
    this.streamer.detailFromCamera(this.framed.camera, this.height, this.focusGroundHeight());
    this.streamer.streamAround(focus.x, focus.y, this.streamingRadiusChunks());
    this.lights.syncAround(this.world.spawnX, this.world.spawnY);
  }

  paintTo(renderer: THREE.WebGLRenderer): void {
    if (this.width < 2 || this.height < 2) return;
    renderer.setSize(this.canvas.width, this.canvas.height, false);
    renderer.render(this.scene, this.framed.camera);
    const context = this.canvas.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = 'copy';
    context.drawImage(renderer.domElement, 0, 0, this.canvas.width, this.canvas.height);
  }

  stillStreaming(): boolean {
    return this.builtChunkCount() < this.neededChunkCount();
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.shared.remove(this);
    this.streamer.dispose();
    this.lights.dispose();
    this.canvas.remove();
  }

  private resize(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    sizeCanvasToContainer(this.canvas, size);
    this.width = Math.max(1, Math.round(size.cssWidth));
    this.height = Math.max(1, Math.round(size.cssHeight));
    this.framed = this.cameraForSize(this.width, this.height);
    this.streamer.invalidateAll();
    this.shared.requestPaint();
  }

  private cameraForSize(width: number, height: number): FramedCamera {
    return godFramedCamera({
      x: this.world.spawnX,
      y: this.world.spawnY,
      facing: PREVIEW_FACING,
      width,
      height,
      cameraDistanceTiles: GOD_DISTANCE_AT_UNIT_ZOOM / this.zoom,
    });
  }

  private streamingRadiusChunks(): number {
    return streamingRadiusChunks(this.framed.visibleRadiusTiles());
  }

  private focusGroundHeight(): number {
    const focus = this.framed.focusPoint();
    return this.world.sampler.elevationAt(Math.floor(focus.x), Math.floor(focus.y));
  }

  private builtChunkCount(): number {
    return this.chunkGroups.children.length;
  }

  private neededChunkCount(): number {
    const acrossChunks = 2 * this.streamingRadiusChunks() + 1;
    return acrossChunks * acrossChunks;
  }
}
