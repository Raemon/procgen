import * as THREE from 'three';
import { worldOfGenome, type GenomeWorld } from '@/features/asset-library/worlds/selfPlay/genomeWorld';
import type { WorldGenome } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { spawnWithRoomToWalk } from '@/features/asset-library/worlds/walkingSim/spawnCell';
import { NO_EXTRA_MARKERS } from '../render/markerSource';
import { ChunkMeshStreamer } from '../render/view3d/chunkMeshStreamer';
import type { FramedCamera } from '../render/view3d/framedCamera';
import { godFramedCamera } from '../render/view3d/godFramedCamera';
import { OVERHEAD_AMBIENT, SceneDaylight } from '../render/view3d/sceneDaylight';
import { streamingRadiusChunks } from '../render/view3d/streamingRadius';
import { textureLoadingIdle } from '../render/view3d/textureLoadingIdle';
import { tileLightsOnlyDeps } from '../render/view3d/tileLightsOnlyDeps';
import { WorldLights } from '../render/view3d/worldLights';
import { createWorldScene } from '../render/view3d/worldScene';
import { isWalkableTile } from '../tileWalkability';
import { shotRenderer, type ShotSize } from './shotRenderer';

const GOD_CAMERA_DISTANCE_TILES = 40;
const LONGEST_SHOT_MS = 12_000;
const SETTLED_FRAMES = 3;
const CONTEXT_LOST = 'the WebGL context was lost while shooting; re-shoot to try again';

interface WorldShotStage {
  world: GenomeWorld;
  scene: THREE.Scene;
  chunkGroups: THREE.Group;
  streamer: ChunkMeshStreamer;
  lights: WorldLights;
  daylight: SceneDaylight;
  camera: FramedCamera;
  daylightLevel: number;
  heightPixels: number;
}

export async function shootGenomeWorld(genome: WorldGenome, size: ShotSize): Promise<string> {
  const renderer = shotRenderer(size);
  const stage = stagedGenomeWorld(genome, size);
  try {
    await paintUntilSettled(stage, renderer);
    if (renderer.getContext().isContextLost()) throw new Error(CONTEXT_LOST);
    return renderer.domElement.toDataURL('image/png');
  } finally {
    dismantle(stage);
  }
}

function stagedGenomeWorld(genome: WorldGenome, size: ShotSize): WorldShotStage {
  const world = worldOfGenome(genome);
  const focus = focusCellOf(world);
  const scene = createWorldScene();
  const chunkGroups = new THREE.Group();
  scene.add(chunkGroups);
  return {
    world,
    scene,
    chunkGroups,
    streamer: new ChunkMeshStreamer(chunkGroups, world.sampler, world.tileAssets, NO_EXTRA_MARKERS),
    lights: new WorldLights(scene, tileLightsOnlyDeps(world)),
    daylight: new SceneDaylight(scene, OVERHEAD_AMBIENT),
    camera: godFramedCamera({
      x: focus.x,
      y: focus.y,
      facing: 0,
      width: size.width,
      height: size.height,
      cameraDistanceTiles: GOD_CAMERA_DISTANCE_TILES,
    }),
    daylightLevel: genome.pipeline.daylight,
    heightPixels: size.height,
  };
}

function focusCellOf(world: GenomeWorld): { x: number; y: number } {
  return (
    spawnWithRoomToWalk((x, y) => isWalkableTile(world.tileAssets, world.sampler.tileAt(x, y))) ?? {
      x: 0,
      y: 0,
    }
  );
}

async function paintUntilSettled(
  stage: WorldShotStage,
  renderer: THREE.WebGLRenderer,
): Promise<void> {
  const texturesIdle = textureLoadingIdle();
  const giveUpAt = Date.now() + LONGEST_SHOT_MS;
  while (Date.now() < giveUpAt) {
    streamOneFrame(stage);
    if (isMeshed(stage) && texturesIdle()) break;
    await nextAnimationFrame();
  }
  for (let frame = 0; frame < SETTLED_FRAMES; frame++) {
    await nextAnimationFrame();
    streamOneFrame(stage);
    renderer.render(stage.scene, stage.camera.camera);
  }
}

function streamOneFrame(stage: WorldShotStage): void {
  stage.daylight.setLevel(stage.daylightLevel);
  stage.camera.update();
  const focus = stage.camera.focusPoint();
  stage.streamer.detailFromCamera(
    stage.camera.camera,
    stage.heightPixels,
    stage.world.sampler.elevationAt(Math.floor(focus.x), Math.floor(focus.y)),
  );
  stage.streamer.streamAround(focus.x, focus.y, radiusInChunks(stage));
  stage.lights.syncAround(focus.x, focus.y);
}

function isMeshed(stage: WorldShotStage): boolean {
  const across = 2 * radiusInChunks(stage) + 1;
  return stage.chunkGroups.children.length >= across * across;
}

function radiusInChunks(stage: WorldShotStage): number {
  return streamingRadiusChunks(stage.camera.visibleRadiusTiles());
}

function dismantle(stage: WorldShotStage): void {
  stage.streamer.dispose();
  stage.lights.dispose();
  stage.scene.clear();
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    let waiting = true;
    const goOn = () => {
      if (!waiting) return;
      waiting = false;
      resolve();
    };
    requestAnimationFrame(goOn);
    const channel = new MessageChannel();
    channel.port1.onmessage = goOn;
    channel.port2.postMessage(0);
  });
}
