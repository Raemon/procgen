import * as THREE from 'three';
import { NO_EXTRA_MARKERS } from '@/features/game/render/markerSource';
import { ChunkMeshStreamer } from '@/features/game/render/view3d/chunkMeshStreamer';
import {
  LAMPLIT_AMBIENT,
  OVERHEAD_AMBIENT,
  SceneDaylight,
} from '@/features/game/render/view3d/sceneDaylight';
import { streamingRadiusChunks } from '@/features/game/render/view3d/streamingRadius';
import { WorldLights } from '@/features/game/render/view3d/worldLights';
import { createCharacterFog, createWorldScene } from '@/features/game/render/view3d/worldScene';
import type { FramedCamera } from '@/features/game/render/view3d/framedCamera';
import { tileLightsOnlyDeps } from '@/features/game/render/view3d/tileLightsOnlyDeps';
import type { HeadlessWorld } from '../../headlessWorld';
import type { WorldViewRequest } from '../worldViewRequest';

export class HeadlessWorldView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = createWorldScene();
  private readonly daylight = new SceneDaylight(this.scene);
  private readonly chunkGroups = new THREE.Group();
  private readonly streamer: ChunkMeshStreamer;
  private readonly lights: WorldLights;

  constructor(
    private readonly world: HeadlessWorld,
    private readonly request: WorldViewRequest,
    private readonly framedCamera: FramedCamera,
  ) {
    this.renderer = capturableRenderer(request);
    this.scene.add(this.chunkGroups);
    this.streamer = new ChunkMeshStreamer(
      this.chunkGroups,
      world.sampler,
      world.tileAssets,
      NO_EXTRA_MARKERS,
    );
    this.lights = new WorldLights(this.scene, tileLightsOnlyDeps(world));
    this.applyCharacterSightline();
    if (request.showCeilings) this.streamer.showCeilings(true);
  }

  canvasElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  builtChunkCount(): number {
    return this.chunkGroups.children.length;
  }

  neededChunkCount(): number {
    const acrossChunks = 2 * this.streamingRadiusChunks() + 1;
    return acrossChunks * acrossChunks;
  }

  gpuLoad(): { drawCalls: number; triangles: number } {
    const render = this.renderer.info.render;
    return { drawCalls: render.calls, triangles: render.triangles };
  }

  streamFrame(): void {
    this.daylight.seeInTheDark(this.request.style === 'character' ? LAMPLIT_AMBIENT : OVERHEAD_AMBIENT);
    this.daylight.setLevel(this.world.store.daylight());
    this.framedCamera.update();
    this.streamAroundFocus();
    this.lights.syncAround(this.request.x, this.request.y);
  }

  paintFrame(): void {
    this.streamFrame();
    this.renderer.render(this.scene, this.framedCamera.camera);
  }

  pngDataUrl(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  private applyCharacterSightline(): void {
    const sightRadius = this.framedCamera.fogSightRadiusTiles();
    if (sightRadius === null) return;
    this.scene.fog = createCharacterFog(sightRadius);
    this.streamer.showCeilings(true);
  }

  private streamAroundFocus(): void {
    const focus = this.framedCamera.focusPoint();
    this.streamer.detailFromCamera(
      this.framedCamera.camera,
      this.request.height,
      this.focusGroundHeight(),
    );
    this.streamer.streamAround(focus.x, focus.y, this.streamingRadiusChunks());
  }

  private streamingRadiusChunks(): number {
    return streamingRadiusChunks(this.framedCamera.visibleRadiusTiles());
  }

  private focusGroundHeight(): number {
    const focus = this.framedCamera.focusPoint();
    return this.world.sampler.elevationAt(Math.floor(focus.x), Math.floor(focus.y));
  }
}

function capturableRenderer(request: WorldViewRequest): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(request.width, request.height);
  document.body.appendChild(renderer.domElement);
  return renderer;
}
