import * as THREE from 'three';
import type { CharacterMotion } from '@/features/asset-library/characters/characterFrame';
import { reportGpuSceneLoad, type GpuSceneLoad } from '../../performance/gpuSceneLoad';
import { measureWork } from '../../performance/workTimers';
import { facingYawRadians } from '../../facing';
import type { CameraView } from './cameraView';
import { listenForCaptureDrag } from '../../capture/listenForCaptureDrag';
import { listenForTileHover } from '../../hover/listenForTileHover';
import { characterWithId } from '../../multiplayer/client/charactersInPlay';
import { listenForDragPan } from '../camera/dragPanListener';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, devicePixelRatioCapped, isCollapsed } from '../canvasSurface';
import type { WorldViewDeps } from '../worldViewDeps';
import { WORLD_CANVAS_CLASSES } from '../worldCanvasClasses';
import { CharacterCamera } from './characterCamera';
import { CharacterSpriteAssets } from './characterSpriteAssets';
import { ChunkMeshStreamer } from './chunkMeshStreamer';
import { CreatureMeshes } from './creatureMeshes';
import { EasedPoint } from './easedPoint';
import { advanceFaceArtAnimations } from './faceArtAnimations';
import { ItemMeshes } from './itemMeshes';
import { RemotePlayerMeshes } from './remotePlayerMeshes';
import { createCharacterFog, createWorldScene, setFogRange } from './worldScene';
import { LAMPLIT_AMBIENT, OVERHEAD_AMBIENT, SceneDaylight } from './sceneDaylight';
import { WorldLights } from './worldLights';
import { PlayerCharacterMesh } from './playerCharacterMesh';
import { FollowCamera } from './followCamera';
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
const STILL_ENOUGH_TILES = 0.05;

export type CameraStyle = 'god' | 'character';

interface SnapshotRequest {
  size: number;
  use(dataUrl: string): void;
}

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = createWorldScene();
  private readonly daylight = new SceneDaylight(this.scene, OVERHEAD_AMBIENT);
  private readonly followCamera = new FollowCamera();
  private readonly characterCamera = new CharacterCamera();
  private readonly characterFog = createCharacterFog();
  private cameraStyle: CameraStyle = 'god';
  private readonly worldGroup = new THREE.Group();
  private readonly characterSprites = new CharacterSpriteAssets();
  private readonly player: PlayerCharacterMesh;
  private readonly easedPlayer: EasedPoint;
  private readonly streamer: ChunkMeshStreamer;
  private readonly terrainOverview: TerrainOverview;
  private readonly creatureMeshes: CreatureMeshes;
  private readonly itemMeshes: ItemMeshes;
  private readonly remotePlayerMeshes: RemotePlayerMeshes;
  private readonly selectionBox: SelectionBox;
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
    this.easedPlayer = new EasedPoint(deps.world.playerX, deps.world.playerY);
    this.canvas = this.renderer.domElement;
    this.canvas.className = WORLD_CANVAS_CLASSES;
    container.appendChild(this.canvas);
    this.player = new PlayerCharacterMesh(deps.creatures, this.characterSprites);
    this.scene.add(this.worldGroup, this.player.object);
    this.streamer = new ChunkMeshStreamer(
      this.worldGroup,
      deps.sampler,
      deps.tileAssets,
      deps.puzzles,
    );
    this.terrainOverview = new TerrainOverview(this.worldGroup, deps.sampler, deps.tileAssets);
    this.creatureMeshes = new CreatureMeshes(
      this.worldGroup,
      deps.creatures,
      deps.sampler,
      this.characterSprites,
    );
    this.itemMeshes = new ItemMeshes(this.worldGroup, deps.items, deps.sampler);
    this.remotePlayerMeshes = new RemotePlayerMeshes(
      this.worldGroup,
      deps.creatures,
      deps.sampler,
      this.characterSprites,
    );
    this.selectionBox = new SelectionBox(this.worldGroup);
    this.worldLights = new WorldLights(this.scene, deps);
    this.speechLabels = new SpeechBubbleLabels(container);
    this.listenForCameraGestures();
    listenForCaptureDrag(this.canvas, deps.capture, (x, y) => this.cellAtPixel(x, y));
    listenForTileHover(this.canvas, deps.hoveredTile, (x, y) => this.cellAtPixel(x, y));
    this.resizeObserver.observe(container);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.onFrame);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.stopReportingGpuLoad();
    this.resizeObserver.disconnect();
    this.creatureMeshes.dispose();
    this.itemMeshes.dispose();
    this.remotePlayerMeshes.dispose();
    this.player.dispose();
    this.characterSprites.dispose();
    this.selectionBox.dispose();
    this.worldLights.dispose();
    this.speechLabels.dispose();
    this.terrainOverview.dispose();
    this.streamer.dispose();
    disposeSharedWorldArt();
    this.renderer.dispose();
    this.canvas.remove();
  }

  setCameraStyle(style: CameraStyle): void {
    if (this.cameraStyle === style) return;
    this.cameraStyle = style;
    this.scene.fog = style === 'character' ? this.characterFog : null;
    this.daylight.seeInTheDark(style === 'character' ? LAMPLIT_AMBIENT : OVERHEAD_AMBIENT);
    this.streamer.showCeilings(style === 'character');
    this.player.visible = style === 'god';
    this.characterCamera.snapOnNextFrame();
    this.followCamera.snapToFocusOnNextUpdate();
    this.resize();
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
    if (this.deps.cameraFocus.followedId() !== null) return;
    this.followCamera.recenterOnPlayer();
  }

  onWorldChanged(): void {
    this.streamer.invalidateAll();
    this.terrainOverview.invalidate();
    this.worldLights.invalidate();
    this.itemMeshes.invalidate();
    this.creatureMeshes.forgetSprites();
    this.remotePlayerMeshes.forgetSprites();
    this.characterSprites.dispose();
    disposeSharedWorldArt();
  }

  private viewYaw(): number {
    return this.cameraStyle === 'god'
      ? this.followCamera.yaw()
      : facingYawRadians(this.deps.world.facing);
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
        if (this.cameraStyle !== 'god') return;
        this.deps.cameraFocus.clear();
        this.followCamera.panByDragPixels(dxPixels, dyPixels);
      },
      () => !this.deps.capture.isActive(),
    );
    this.canvas.addEventListener('dblclick', () => {
      this.deps.cameraFocus.clear();
      this.followCamera.recenterOnPlayer();
    });
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
    this.easedPlayer.approach(this.deps.world.playerX, this.deps.world.playerY, dtSeconds);
    this.applySightRadius();
    this.elapsedSeconds += dtSeconds;
    advanceFaceArtAnimations(this.elapsedSeconds);
    const view = { yaw: this.viewYaw(), seconds: this.elapsedSeconds };
    this.placePlayer(view);
    measureWork('creature meshes', () => this.creatureMeshes.syncTo(this.deps.sim, view));
    this.remotePlayerMeshes.syncTo(this.deps.remotePlayers, dtSeconds, view);
    this.selectionBox.showRegion(this.deps.capture.selectedRegion(), this.focusGroundHeight());
    this.updateActiveCamera(dtSeconds);
    this.streamAroundCameraFocus();
    this.lightAroundPlayer();
    this.showSpeechBubbles();
    measureWork('gpu submit', () => this.renderer.render(this.scene, this.activeCamera()));
    this.serveSnapshotRequests();
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
    const firstPerson = this.cameraStyle === 'character';
    const selfId = this.deps.remotePlayers.selfId;
    this.speechLabels.showPinned(firstPerson ? this.deps.speech.linesFor(selfId) : []);
    this.speechLabels.showAnchored(
      speechBubbleAnchors(this.deps.speech, (speakerId) =>
        this.speakerHeadPoint(speakerId, selfId, firstPerson),
      ),
      this.activeCamera(),
    );
  }

  private speakerHeadPoint(
    speakerId: number,
    selfId: number,
    firstPerson: boolean,
  ): THREE.Vector3 | null {
    if (speakerId === selfId) return firstPerson ? null : this.player.position;
    const head = this.remotePlayerMeshes.headPointOf(speakerId);
    if (!head) return null;
    return firstPerson && !this.isWithinCharacterSight(head) ? null : head;
  }

  private isWithinCharacterSight(head: THREE.Vector3): boolean {
    return isWithinSightRadius(
      head.x - (this.easedPlayer.x + 0.5),
      head.z - (this.easedPlayer.y + 0.5),
      this.sightRadiusTiles(),
    );
  }

  private sightRadiusTiles(): number {
    return clampSightRadiusTiles(this.deps.world.sightRadiusTiles);
  }

  private applySightRadius(): void {
    const radius = this.sightRadiusTiles();
    setFogRange(this.characterFog, radius);
    this.characterCamera.setSightRadiusTiles(radius);
  }

  private updateActiveCamera(dtSeconds: number): void {
    const eased = this.easedPlayer;
    if (this.cameraStyle === 'god') {
      this.followCamera.update(dtSeconds, eased.x, eased.y, facingYawRadians(this.deps.world.facing));
      this.aimAtFollowedCharacter();
      return;
    }
    this.characterCamera.update(
      dtSeconds,
      eased.x,
      eased.y,
      this.deps.sampler.elevationAt(Math.round(eased.x), Math.round(eased.y)),
      facingYawRadians(this.deps.world.facing),
    );
  }

  private aimAtFollowedCharacter(): void {
    const followedId = this.deps.cameraFocus.followedId();
    if (followedId === null) return;
    const followed = characterWithId(this.deps.world, this.deps.remotePlayers, followedId);
    if (!followed) {
      this.deps.cameraFocus.clear();
      this.followCamera.recenterOnPlayer();
      return;
    }
    this.followCamera.lookAtTile(followed.x, followed.y);
  }

  private lightAroundPlayer(): void {
    this.daylight.setLevel(this.deps.store.daylight());
    measureWork('world lights', () =>
      this.worldLights.syncAround(this.easedPlayer.x, this.easedPlayer.y),
    );
  }

  private streamAroundCameraFocus(): void {
    const focus = this.focusPoint();
    const camera = this.activeCamera();
    const viewportHeight = this.renderer.domElement.clientHeight;
    const groundElevation = this.focusGroundHeight();
    const radiusTiles =
      this.cameraStyle === 'god'
        ? this.followCamera.visibleGroundRadiusTiles(groundElevation)
        : this.sightRadiusTiles();
    const overviewVisible = this.cameraStyle === 'god' && needsTerrainOverview(radiusTiles);
    if (overviewVisible) {
      measureWork('terrain overview', () =>
        this.terrainOverview.syncAround(focus.x, focus.y, radiusTiles),
      );
    } else {
      this.terrainOverview.hide();
    }
    this.streamer.detailFromCamera(camera, viewportHeight, groundElevation);
    this.streamer.streamAround(focus.x, focus.y, streamingRadiusChunks(radiusTiles));
    measureWork('item meshes', () =>
      this.itemMeshes.syncAround(
        focus.x,
        focus.y,
        detailedContentRadiusTiles(radiusTiles),
      ),
    );
  }

  private placePlayer(view: CameraView): void {
    const eased = this.easedPlayer;
    this.player.standAt(
      {
        x: eased.x + 0.5,
        y: eased.y + 0.5,
        elevation: this.deps.sampler.elevationAt(Math.round(eased.x), Math.round(eased.y)),
        motion: this.playerMotion(),
      },
      view,
    );
  }

  private playerMotion(): CharacterMotion {
    const stepsAway = Math.hypot(
      this.deps.world.playerX - this.easedPlayer.x,
      this.deps.world.playerY - this.easedPlayer.y,
    );
    return {
      heading: facingYawRadians(this.deps.world.facing),
      moving: stepsAway > STILL_ENOUGH_TILES,
    };
  }
}
