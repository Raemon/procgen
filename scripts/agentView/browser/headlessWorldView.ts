import * as THREE from 'three';
import '@/worlds/client';
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { facingYawRadians } from '@/features/game/facing';
import { fightForThePlayer } from '@/features/game/combat/fightForThePlayer';
import { CreatureSim } from '@/features/game/creatureSim/creatureSim';
import { WorldRulesSet } from '@/features/game/worldRulesSet';
import { CharacterSpriteAssets } from '@/features/game/render/view3d/characterSpriteAssets';
import { CreatureMeshes } from '@/features/game/render/view3d/creatureMeshes';
import { isWalkableTile } from '@/features/game/tileWalkability';
import { ChunkMeshStreamer } from '@/features/game/render/view3d/chunkMeshStreamer';
import { DoorOpenings } from '@/features/game/render/view3d/animations/doorOpenings';
import {
  LAMPLIT_AMBIENT,
  OVERHEAD_AMBIENT,
  SceneDaylight,
} from '@/features/game/render/view3d/sceneDaylight';
import { streamingRadiusChunks } from '@/features/game/render/view3d/streamingRadius';
import { PlayerCharacterMesh } from '@/features/game/render/view3d/playerCharacterMesh';
import { SightShadows } from '@/features/game/render/view3d/sightShadows';
import { ExploredCells } from '@/features/game/vision/exploredCells';
import { lineOfSightFrom } from '@/features/game/vision/lineOfSight';
import { WorldLights } from '@/features/game/render/view3d/worldLights';
import { createCharacterFog, createWorldScene } from '@/features/game/render/view3d/worldScene';
import type { FramedCamera } from '@/features/game/render/view3d/framedCamera';
import { tileLightsOnlyDeps } from '@/features/game/render/view3d/tileLightsOnlyDeps';
import type { HeadlessWorld } from '../../headlessWorld';
import type { WorldViewRequest } from '../worldViewRequest';

const PLAYER_POSE_SECONDS = 0.42;
const VISIBLE_GATE_RADIUS_TILES = 48;
const EARLIER_LOOKS_FURTHER = 3;

export class HeadlessWorldView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = createWorldScene();
  private readonly daylight = new SceneDaylight(this.scene);
  private readonly chunkGroups = new THREE.Group();
  private readonly streamer: ChunkMeshStreamer;
  private readonly gates: DoorOpenings;
  private readonly lights: WorldLights;
  private readonly creatures: CreatureMeshes;
  private readonly sim: CreatureSim;
  private readonly player = new PlayerCharacterMesh();
  private readonly sightShadows: SightShadows | null;

  constructor(
    private readonly world: HeadlessWorld,
    private readonly request: WorldViewRequest,
    private readonly framedCamera: FramedCamera,
  ) {
    this.renderer = capturableRenderer(request);
    this.scene.add(this.chunkGroups);
    const overlay = overlayOf(world);
    this.streamer = new ChunkMeshStreamer(
      this.chunkGroups,
      world.sampler,
      world.tileAssets,
      overlay,
    );
    this.gates = new DoorOpenings(this.chunkGroups, world.sampler, overlay);
    this.gates.holdEveryGateAt(request.gateOpenness);
    this.lights = new WorldLights(this.scene, tileLightsOnlyDeps(world));
    this.creatures = new CreatureMeshes(
      this.chunkGroups,
      world.creatureAssets,
      world.sampler,
      new CharacterSpriteAssets(),
    );
    this.sim = new CreatureSim({
      sampler: world.sampler,
      creatureAssets: world.creatureAssets,
      world: { playerX: request.x, playerY: request.y },
      isWalkableAt: (x, y) => isWalkableTile(world.tileAssets, world.sampler.tileAt(x, y)),
      fight: fightForThePlayer(world.creatureAssets),
    });
    this.sightShadows = sightShadowsForRequest(this.scene, world, request);
    this.player.visible = request.style !== 'character';
    this.scene.add(this.player.object);
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
    this.standPlayerOnTheirTile();
    this.gates.showAround(this.request.x, this.request.y, VISIBLE_GATE_RADIUS_TILES);
    this.lights.syncAround(this.request.x, this.request.y, [this.player.lightSource()]);
    this.castSightShadows();
    this.showTheLivingWorld();
  }

  paintFrame(): void {
    this.streamFrame();
    this.renderer.render(this.scene, this.framedCamera.camera);
  }

  pngDataUrl(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  private standPlayerOnTheirTile(): void {
    const heading = facingYawRadians(this.request.facing);
    this.player.standAt(
      {
        x: this.request.x + 0.5,
        y: this.request.y + 0.5,
        elevation: this.world.sampler.elevationAt(this.request.x, this.request.y),
        motion: { heading, moving: false },
      },
      { yaw: heading, seconds: PLAYER_POSE_SECONDS },
    );
  }

  private castSightShadows(): void {
    const radius = this.request.sightRadiusTiles;
    if (!this.sightShadows || radius === null) return;
    this.sightShadows.castAround(
      this.request.x,
      this.request.y,
      radius,
      this.framedCamera.visibleRadiusTiles(),
    );
  }

  private showTheLivingWorld(): void {
    this.sim.step(0);
    this.creatures.syncTo(this.sim, { yaw: facingYawRadians(this.request.facing), seconds: 0 });
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

function sightShadowsForRequest(
  scene: THREE.Scene,
  world: HeadlessWorld,
  request: WorldViewRequest,
): SightShadows | null {
  const radius = request.sightRadiusTiles;
  if (request.style !== 'topdown' || radius === null) return null;
  const explored = new ExploredCells();
  const here = { x: request.x, y: request.y };
  lineOfSightFrom(world.sampler, world.tileAssets, here, radius * EARLIER_LOOKS_FURTHER, explored);
  return new SightShadows(scene, { sampler: world.sampler, tileAssets: world.tileAssets, explored });
}

function overlayOf(world: HeadlessWorld): WorldRulesSet {
  const rules = new WorldRulesSet({
    tileIsWalkable: (x, y) => isWalkableTile(world.tileAssets, world.sampler.tileAt(x, y)),
    elevationAt: (x, y) => world.sampler.elevationAt(x, y),
  });
  rules.attach(world.store, {
    items: NO_ITEMS,
    builtValueOf: (nodeId) => world.evaluator.builtValueOf(nodeId),
  });
  return rules;
}
