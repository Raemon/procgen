import * as THREE from 'three';
import { reportGpuSceneLoad, type GpuSceneLoad } from '../../performance/gpuSceneLoad';
import type { LightSource } from '../../light/lightEmission';
import { measureWork } from '../../performance/workTimers';
import { facingYawRadians } from '../../facing';
import { listenForCaptureDrag } from '../../capture/listenForCaptureDrag';
import { listenForTileHover } from '../../hover/listenForTileHover';
import { characterWithId } from '../../multiplayer/client/charactersInPlay';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import type { WorldRedraw } from '@/features/app-shell/runtime/worldRenderers';
import type { WorldViewDeps } from '../worldViewDeps';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { CoveredCells } from './animations/coveredCells';
import { puzzleAnimationsOf } from './animations/puzzleAnimations';
import type { WorldAnimations } from './animations/worldAnimations';
import { CameraRig, type CameraStyle } from './cameraRig';
import type { CameraView } from './cameraView';
import { CharacterSpriteAssets } from './characterSpriteAssets';
import { ChunkMeshStreamer } from './chunkMeshStreamer';
import { CreatureMeshes } from './creatureMeshes';
import { advanceFaceArtAnimations } from './faceArtAnimations';
import { ItemMeshes } from './itemMeshes';
import { PlayerPresence } from './playerPresence';
import { RemotePlayerMeshes } from './remotePlayerMeshes';
import { createCharacterFog, createWorldScene, setFogRange } from './worldScene';
import { LAMPLIT_AMBIENT, OVERHEAD_AMBIENT, SceneDaylight } from './sceneDaylight';
import { WorldLights } from './worldLights';
import { SightShadows } from './sightShadows';
import { TopDownPlayerMarker } from './topDownPlayerMarker';
import { worldCellUnderPointer } from './pointerToWorldCell';
import { SelectionBox } from './selectionBox';
import { speechBubbleAnchors } from './speechBubbleAnchors';
import { SpeechBubbleLabels } from './speechBubbleLabels';
import { squareThumbnailOf } from './squareThumbnail';
import {
  detailedContentRadiusTiles,
  needsTerrainOverview,
  streamingRadiusChunks,
} from './streamingRadius';
import { disposeSharedWorldArt } from './sharedWorldArt';
import { clampSightRadiusTiles, isWithinSightRadius } from '../../vision/characterSight';
import { TerrainOverview } from './terrainOverview';

const MAX_FRAME_MS = 100;
const MOST_SNAPSHOTS_WORTH_QUEUEING = 4;

export type { CameraStyle } from './cameraRig';

interface SnapshotRequest {
  size: number;
  use(dataUrl: string): void;
}

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = createWorldScene();
  private readonly daylight = new SceneDaylight(this.scene, OVERHEAD_AMBIENT);
  private readonly rig = new CameraRig();
  private readonly characterFog = createCharacterFog();
  private readonly worldGroup = new THREE.Group();
  private readonly characterSprites = new CharacterSpriteAssets();
  private readonly presence: PlayerPresence;
  private readonly covered = new CoveredCells((cell) => this.streamer.invalidateAt(cell.x, cell.y));
  private readonly animations: WorldAnimations;
  private readonly streamer: ChunkMeshStreamer;
  private readonly terrainOverview: TerrainOverview;
  private readonly creatureMeshes: CreatureMeshes;
  private readonly itemMeshes: ItemMeshes;
  private readonly remotePlayerMeshes: RemotePlayerMeshes;
  private readonly selectionBox: SelectionBox;
  private readonly sightShadows: SightShadows;
  private readonly topDownMarker: TopDownPlayerMarker;
  private readonly worldLights: WorldLights;
  private readonly speechLabels: SpeechBubbleLabels;
  private readonly resizeObserver = new ResizeObserver(() => this.resize());
  private readonly stopReportingGpuLoad = reportGpuSceneLoad(() => this.gpuSceneLoad());
  private readonly snapshotRequests: SnapshotRequest[] = [];
  private animationFrame = 0;
  private lastFrameTime = 0;
  private elapsedSeconds = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly deps: WorldViewDeps,
  ) {
    this.canvas = this.renderer.domElement;
    this.canvas.className = WORLD_CANVAS_CLASSES;
    container.appendChild(this.canvas);
    this.presence = new PlayerPresence({ world: deps.world, surfaceAt: deps.surfaceAt });
    this.scene.add(this.worldGroup, this.presence.object);
    this.streamer = new ChunkMeshStreamer(
      this.worldGroup,
      deps.sampler,
      deps.tileAssets,
      this.covered.markersExcept(deps.overlay),
    );
    this.terrainOverview = new TerrainOverview(this.worldGroup, deps.sampler, deps.tileAssets);
    this.creatureMeshes = new CreatureMeshes(
      this.worldGroup,
      deps.creatures,
      deps.sampler,
      this.characterSprites,
    );
    this.itemMeshes = new ItemMeshes(this.worldGroup, deps.items, deps.sampler);
    this.remotePlayerMeshes = new RemotePlayerMeshes(this.worldGroup, (x, y) =>
      deps.surfaceAt(x, y),
    );
    this.selectionBox = new SelectionBox(this.worldGroup);
    this.topDownMarker = new TopDownPlayerMarker(this.scene);
    this.sightShadows = new SightShadows(this.scene, {
      sampler: deps.sampler,
      tileAssets: deps.tileAssets,
      explored: deps.world.explored,
    });
    this.worldLights = new WorldLights(this.scene, deps);
    this.speechLabels = new SpeechBubbleLabels(container);
    this.listenForCanvasGestures();
    this.animations = puzzleAnimationsOf(this.worldGroup, {
      puzzleCues: deps.puzzleCues,
      surfaceAt: deps.surfaceAt,
      covered: this.covered,
    });
    this.resizeObserver.observe(container);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.animations.dispose();
    this.presence.dispose();
    this.stopReportingGpuLoad();
    this.resizeObserver.disconnect();
    this.creatureMeshes.dispose();
    this.itemMeshes.dispose();
    this.remotePlayerMeshes.dispose();
    this.characterSprites.dispose();
    this.selectionBox.dispose();
    this.sightShadows.dispose();
    this.topDownMarker.dispose();
    this.worldLights.dispose();
    this.speechLabels.dispose();
    this.terrainOverview.dispose();
    this.streamer.dispose();
    disposeSharedWorldArt();
    this.renderer.dispose();
    this.canvas.remove();
  }

  setCameraStyle(style: CameraStyle): void {
    if (this.rig.style === style) return;
    this.rig.lookThrough(style);
    this.scene.fog = style === 'character' ? this.characterFog : null;
    this.daylight.seeInTheDark(style === 'character' ? LAMPLIT_AMBIENT : OVERHEAD_AMBIENT);
    this.streamer.showCeilings(style === 'character');
    this.presence.visible = style !== 'character';
    if (style !== 'topdown') {
      this.sightShadows.hide();
      this.topDownMarker.hide();
    }
    this.resize();
  }

  lookBy(step: -1 | 1): void {
    this.rig.lookBy(step);
  }

  private gpuSceneLoad(): GpuSceneLoad {
    const info = this.renderer.info;
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
    };
  }

  recenterOnPlayer(): void {
    this.rig.topDown.recenterOnPlayer();
    if (this.deps.cameraFocus.followedId() !== null) return;
    this.rig.follow.recenterOnPlayer();
  }

  redraw(change: WorldRedraw): void {
    if (change === 'shared-state') this.onSharedStateChanged();
    else this.onWorldChanged();
  }

  private onSharedStateChanged(): void {
    this.streamer.invalidateAll();
    this.itemMeshes.invalidate();
    this.worldLights.invalidate();
  }

  private onWorldChanged(): void {
    this.streamer.invalidateAll();
    this.terrainOverview.invalidate();
    this.worldLights.invalidate();
    this.itemMeshes.invalidate();
    this.sightShadows.invalidate();
    this.creatureMeshes.forgetSprites();
    this.characterSprites.dispose();
    disposeSharedWorldArt();
  }

  private viewYaw(): number {
    return this.rig.yaw(facingYawRadians(this.deps.world.facing));
  }

  private cellAtPixel(offsetX: number, offsetY: number) {
    return worldCellUnderPointer(
      this.rig.camera,
      this.canvas,
      offsetX,
      offsetY,
      this.focusGroundHeight(),
    );
  }

  private focusGroundHeight(): number {
    const focus = this.rig.focusPoint();
    return this.deps.sampler.elevationAt(Math.floor(focus.x), Math.floor(focus.y));
  }

  private listenForCanvasGestures(): void {
    listenForWheelZoom(this.canvas, (wheelPixelsY) => this.rig.zoomByWheelPixels(wheelPixelsY));
    listenForDragPan(
      this.canvas,
      (dxPixels, dyPixels) => {
        if (this.rig.style === 'god') this.deps.cameraFocus.clear();
        this.rig.panByDragPixels(dxPixels, dyPixels);
      },
      () => !this.deps.capture.isActive(),
    );
    this.canvas.addEventListener('dblclick', () => {
      this.deps.cameraFocus.clear();
      this.recenterOnPlayer();
    });
    listenForCaptureDrag(this.canvas, this.deps.capture, (x, y) => this.cellAtPixel(x, y));
    listenForTileHover(this.canvas, this.deps.hoveredTile, (x, y) => this.cellAtPixel(x, y));
  }

  private resize(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    this.renderer.setPixelRatio(devicePixelRatioCapped());
    this.renderer.setSize(size.cssWidth, size.cssHeight);
    this.rig.setViewportSize(size.cssWidth, size.cssHeight);
  }

  private onFrame = (time: number): void => {
    this.renderFrame(Math.min(MAX_FRAME_MS, time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;
    this.animationFrame = requestAnimationFrame(this.onFrame);
  };

  private renderFrame(dtSeconds: number): void {
    if (isCollapsed(containerSize(this.container))) return;
    this.animations.advance(dtSeconds);
    this.presence.advance(dtSeconds);
    this.applySightRadius();
    const view = this.momentToDraw(dtSeconds);
    this.presence.place(view);
    measureWork('creature meshes', () => this.creatureMeshes.syncTo(this.deps.sim, view));
    this.remotePlayerMeshes.syncTo(this.deps.remotePlayers, dtSeconds, view);
    this.selectionBox.showRegion(this.deps.capture.selectedRegion(), this.focusGroundHeight());
    this.updateActiveCamera(dtSeconds);
    this.castSightShadows();
    this.streamAroundCameraFocus();
    this.lightAroundPlayer();
    this.showSpeechBubbles();
    measureWork('gpu submit', () => this.renderer.render(this.scene, this.rig.camera));
    this.serveSnapshotRequests();
  }

  private momentToDraw(dtSeconds: number): CameraView {
    this.elapsedSeconds += dtSeconds;
    advanceFaceArtAnimations(this.elapsedSeconds);
    return { yaw: this.viewYaw(), seconds: this.elapsedSeconds };
  }

  captureAfterNextFrame(size: number, use: (dataUrl: string) => void): void {
    if (this.snapshotRequests.length >= MOST_SNAPSHOTS_WORTH_QUEUEING) this.snapshotRequests.shift();
    this.snapshotRequests.push({ size, use });
  }

  private serveSnapshotRequests(): void {
    if (this.snapshotRequests.length === 0) return;
    for (const request of this.snapshotRequests.splice(0)) {
      request.use(squareThumbnailOf(this.canvas, request.size));
    }
  }

  private showSpeechBubbles(): void {
    const firstPerson = this.rig.style === 'character';
    const selfId = this.deps.remotePlayers.selfId;
    this.speechLabels.showPinned(firstPerson ? this.deps.speech.linesFor(selfId) : []);
    this.speechLabels.showAnchored(
      speechBubbleAnchors(this.deps.speech, (speakerId) =>
        this.speakerHeadPoint(speakerId, selfId, firstPerson),
      ),
      this.rig.camera,
    );
  }

  private speakerHeadPoint(
    speakerId: number,
    selfId: number,
    firstPerson: boolean,
  ): THREE.Vector3 | null {
    if (speakerId === selfId) return firstPerson ? null : this.presence.position;
    const head = this.remotePlayerMeshes.headPointOf(speakerId);
    if (!head) return null;
    return firstPerson && !this.isWithinCharacterSight(head) ? null : head;
  }

  private isWithinCharacterSight(head: THREE.Vector3): boolean {
    return isWithinSightRadius(
      head.x - (this.presence.eased.x + 0.5),
      head.z - (this.presence.eased.y + 0.5),
      this.sightRadiusTiles(),
    );
  }

  private sightRadiusTiles(): number {
    return clampSightRadiusTiles(this.deps.world.sightRadiusTiles);
  }

  private applySightRadius(): void {
    const radius = this.sightRadiusTiles();
    setFogRange(this.characterFog, radius);
    this.rig.character.setSightRadiusTiles(radius);
  }

  private castSightShadows(): void {
    if (this.rig.style !== 'topdown') return;
    this.topDownMarker.hoverOver(this.presence.position);
    this.sightShadows.castAround(
      this.deps.world.playerX,
      this.deps.world.playerY,
      this.sightRadiusTiles(),
      this.rig.topDown.visibleGroundRadiusTiles(),
    );
  }

  private updateActiveCamera(dtSeconds: number): void {
    this.rig.update(dtSeconds, {
      x: this.presence.eased.x,
      y: this.presence.eased.y,
      groundElevation: this.focusGroundHeight(),
      eyeElevation: this.presence.elevation(),
      facingYaw: facingYawRadians(this.deps.world.facing),
    });
    this.aimAtFollowedCharacter();
  }

  private aimAtFollowedCharacter(): void {
    const followedId = this.deps.cameraFocus.followedId();
    if (this.rig.style !== 'god' || followedId === null) return;
    const followed = characterWithId(this.deps.world, this.deps.remotePlayers, followedId);
    if (!followed) {
      this.deps.cameraFocus.clear();
      this.rig.follow.recenterOnPlayer();
      return;
    }
    this.rig.follow.lookAtTile(followed.x, followed.y);
  }

  private lightAroundPlayer(): void {
    this.daylight.setLevel(this.deps.store.daylight());
    measureWork('world lights', () =>
      this.worldLights.syncAround(
        this.presence.eased.x,
        this.presence.eased.y,
        this.lanternSources(),
      ),
    );
  }

  private lanternSources(): LightSource[] {
    return [this.presence.lightSource(), ...this.remotePlayerMeshes.lightSources()];
  }

  private streamAroundCameraFocus(): void {
    const focus = this.rig.focusPoint();
    const groundElevation = this.focusGroundHeight();
    const radiusTiles = this.rig.visibleGroundRadiusTiles(groundElevation, this.sightRadiusTiles());
    this.showTerrainOverview(focus, radiusTiles);
    this.streamer.detailFromCamera(this.rig.camera, this.renderer.domElement.clientHeight, groundElevation);
    this.streamer.streamAround(focus.x, focus.y, streamingRadiusChunks(radiusTiles));
    measureWork('item meshes', () =>
      this.itemMeshes.syncAround(focus.x, focus.y, detailedContentRadiusTiles(radiusTiles)),
    );
  }

  private showTerrainOverview(focus: { x: number; y: number }, radiusTiles: number): void {
    if (this.rig.style !== 'god' || !needsTerrainOverview(radiusTiles)) {
      this.terrainOverview.hide();
      return;
    }
    measureWork('terrain overview', () =>
      this.terrainOverview.syncAround(focus.x, focus.y, radiusTiles),
    );
  }

}
