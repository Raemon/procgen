import * as THREE from 'three';
import { cameraRelativeStep } from '../input/cameraRelativeStep';
import { PanOffset } from '../render/camera/panOffset';
import { ZoomScale } from '../render/camera/zoomScale';
import { WheelTileZoom } from '../render/camera/wheelTileZoom';
import {
  MAX_GOD_VIEW_SIZE_TILES,
  MIN_GOD_VIEW_SIZE_TILES,
  clampGodViewSizeTiles,
} from '../vision/godViewSize';
import { worldPanForDrag } from '../render/view3d/dragToWorldPan';
import {
  detailedContentRadiusTiles,
  needsTerrainOverview,
  streamingRadiusChunks,
  terrainOverviewGroundRadiusTiles,
} from '../render/view3d/streamingRadius';
import { FollowCamera } from '../render/view3d/followCamera';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { TerrainOverview } from '../render/view3d/terrainOverview';
import { ChunkMeshStreamer } from '../render/view3d/chunkMeshStreamer';
import { NO_EXTRA_MARKERS } from '../render/markerSource';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';

export function checkCameraMovementAndZoom(check: CheckReporter): void {
  check('forward faces north with the camera at north', String(cameraRelativeStep(0, 1, 0)) === '0,-1');
  check('forward faces east with the camera turned right', String(cameraRelativeStep(1, 1, 0)) === '1,0');
  check('strafing right of south faces west', String(cameraRelativeStep(2, 0, 1)) === '-1,0');

  const camera = new FollowCamera();
  camera.setViewportSize(1600, 900);
  camera.update(0, 0, 0, Math.PI / 4);
  check('god camera takes its 45 degree facing directly from shared world facing', camera.yaw() === Math.PI / 4);
  const closeGroundRadius = camera.visibleGroundRadiusTiles();
  camera.zoomByWheelPixels(4200);
  camera.update(0, 0, 0, Math.PI / 4);
  check('zooming the god camera out expands the visible ground', camera.visibleGroundRadiusTiles() > closeGroundRadius);
  check(
    'the god camera keeps a stable depth precision ratio while zooming far out',
    camera.camera.far / camera.camera.near <= 1600.0000001,
  );

  const flatSpawn = new FollowCamera();
  flatSpawn.setViewportSize(1600, 900);
  flatSpawn.update(0, 0, 0, 0);
  const flatHeight = flatSpawn.camera.position.y;
  const flatRadius = flatSpawn.visibleGroundRadiusTiles();
  const highSpawn = new FollowCamera();
  highSpawn.setViewportSize(1600, 900);
  highSpawn.update(0, 0, 0, 0, 9);
  check('the god camera spawns above the ground it looks at', highSpawn.camera.position.y > 9);
  check(
    'high ground lifts the whole camera rig, keeping the flat-world framing',
    Math.abs(highSpawn.camera.position.y - 9 - flatHeight) < 1e-9 &&
      Math.abs(highSpawn.visibleGroundRadiusTiles(9) - flatRadius) < 1e-6,
  );
  highSpawn.update(0.05, 0, 0, 0, 0);
  check(
    'the god camera glides rather than pops when its focus drops off a cliff',
    highSpawn.camera.position.y < 9 + flatHeight && highSpawn.camera.position.y > flatHeight,
  );

  const zoom = new ZoomScale(1, 0.25, 4);
  zoom.applyWheelPixels(-420);
  check('one wheel notch out doubles the zoom scale', Math.abs(zoom.current() - 2) < 1e-9);
  zoom.applyWheelPixels(420);
  check('scrolling back returns to the starting scale', Math.abs(zoom.current() - 1) < 1e-9);
  zoom.applyWheelPixels(-4200);
  check('zooming in stops at the maximum scale', zoom.current() === 4);
  zoom.applyWheelPixels(42000);
  check('zooming out stops at the minimum scale', zoom.current() === 0.25);

  const tileZoom = new WheelTileZoom(clampGodViewSizeTiles);
  check('one wheel notch out roughly doubles the tiles in an ascii view', tileZoom.sizeAfterWheelPixels(33, 420) === 67);
  check('a notch too small to change the tile count leaves the view alone', tileZoom.sizeAfterWheelPixels(33, 4) === null);
  check('nudges that add up to a notch do change it, since the leftovers are kept', (() => {
    const nudged = new WheelTileZoom(clampGodViewSizeTiles);
    for (let nudge = 0; nudge < 3; nudge++) {
      if (nudged.sizeAfterWheelPixels(33, 5) !== null) return false;
    }
    return nudged.sizeAfterWheelPixels(33, 5) === 35;
  })());
  check('zooming an ascii view in and out stops at the supported widths', (() => {
    const bounded = new WheelTileZoom(clampGodViewSizeTiles);
    return (
      bounded.sizeAfterWheelPixels(33, 4200) === MAX_GOD_VIEW_SIZE_TILES &&
      bounded.sizeAfterWheelPixels(MAX_GOD_VIEW_SIZE_TILES, -42000) === MIN_GOD_VIEW_SIZE_TILES &&
      bounded.sizeAfterWheelPixels(MIN_GOD_VIEW_SIZE_TILES, -4200) === null
    );
  })());

  const pan = new PanOffset();
  pan.shiftBy(3, -2);
  check('panning accumulates in tiles', pan.tilesX() === 3 && pan.tilesY() === -2);
  check('recentering reports that it moved the camera', pan.recenter() && pan.tilesX() === 0);
  check('recentering an unpanned camera is a no-op', !pan.recenter());

  const northView = { yaw: 0, worldPerPixel: 0.1, pitchRadians: Math.PI / 2 };
  const draggedRight = worldPanForDrag({ dxPixels: 10, dyPixels: 0 }, northView);
  check(
    'dragging right pulls the world right by moving the camera west',
    Math.abs(draggedRight.dx + 1) < 1e-9 && Math.abs(draggedRight.dy) < 1e-9,
  );
  const draggedDown = worldPanForDrag({ dxPixels: 0, dyPixels: 10 }, northView);
  check(
    'dragging down looks further north',
    Math.abs(draggedDown.dy + 1) < 1e-9 && Math.abs(draggedDown.dx) < 1e-9,
  );
  const turnedRight = worldPanForDrag(
    { dxPixels: 10, dyPixels: 0 },
    { ...northView, yaw: Math.PI / 2 },
  );
  check(
    'dragging right with the camera turned right moves the camera north',
    Math.abs(turnedRight.dx) < 1e-9 && Math.abs(turnedRight.dy + 1) < 1e-9,
  );
  const shallowPitch = worldPanForDrag({ dxPixels: 0, dyPixels: 10 }, { ...northView, pitchRadians: Math.PI / 6 });
  check('a shallower pitch covers more ground per vertical drag pixel', Math.abs(shallowPitch.dy) > 1);

  check('a close camera streams the minimum chunk radius', streamingRadiusChunks(8) === 2);
  check('zooming out streams more chunks', streamingRadiusChunks(120) > streamingRadiusChunks(40));
  check('streaming radius stays capped when zoomed way out', streamingRadiusChunks(100000) === 6);
  check('the terrain overview starts before detailed chunk streaming would truncate', !needsTerrainOverview(160) && needsTerrainOverview(161));
  check(
    'the terrain overview always covers the requested zoom radius',
    terrainOverviewGroundRadiusTiles(10_000_000) >= 10_000_000,
  );
  check(
    'far zoom keeps a bounded radius of detailed world content',
    detailedContentRadiusTiles(10_000_000) === 160,
  );
  checkTerrainOverviewDrawsImmediately(check);
  checkOverviewReseedsFromNearbyTerrainOnZoom(check);
  checkStreamerKeepsBuiltChunksAcrossZoom(check);
}

function checkTerrainOverviewDrawsImmediately(check: CheckReporter): void {
  const root = new THREE.Group();
  const sampler = {
    tileAt: () => 1,
    elevationAt: () => 0,
  } as unknown as WorldSampler;
  const tileAssets = {
    byId: () => ({ color: '#6d8a55', role: 'grass', faceArt: null, textureId: null }),
  } as unknown as ReadOnlyTileAssets;
  const overview = new TerrainOverview(root, sampler, tileAssets);
  overview.syncAround(0, 0, 1_000);
  const group = root.children[0] as THREE.Group;
  const mesh = group.children[0] as THREE.InstancedMesh;
  check(
    'the terrain overview allocates colored macro-cells across the view immediately',
    group.visible && mesh.count > 0 && mesh.instanceColor?.count === mesh.count,
  );
  check(
    'overview instance colors do not ask the box geometry for a missing vertex color buffer',
    !Array.isArray(mesh.material) && !mesh.material.vertexColors,
  );
  overview.dispose();
}

function checkOverviewReseedsFromNearbyTerrainOnZoom(check: CheckReporter): void {
  const westColor = new THREE.Color('#d8cfa8').getHex();
  const eastColor = new THREE.Color('#4a6a3a').getHex();
  let slowSampling = false;
  const sampler = {
    tileAt: (x: number) => {
      if (slowSampling) {
        const end = performance.now() + 5;
        while (performance.now() < end);
      }
      return x < 0 ? 1 : 2;
    },
    elevationAt: () => 0,
  } as unknown as WorldSampler;
  const tileAssets = {
    byId: (id: number) => ({
      color: id === 1 ? '#d8cfa8' : '#4a6a3a',
      role: 'grass',
      faceArt: null,
      textureId: null,
    }),
  } as unknown as ReadOnlyTileAssets;
  const root = new THREE.Group();
  const overview = new TerrainOverview(root, sampler, tileAssets);
  for (let i = 0; i < 20; i++) overview.syncAround(0, 0, 20);
  const mesh = (root.children[0] as THREE.Group).children[0] as THREE.InstancedMesh;
  const color = new THREE.Color();
  const westInstance = 6 * 12;
  const eastInstance = 6 * 12 + 11;
  mesh.getColorAt(westInstance, color);
  const westBefore = color.getHex();
  mesh.getColorAt(eastInstance, color);
  const eastBefore = color.getHex();
  check(
    'the overview paints each side of the world with its own tile color',
    westBefore === westColor && eastBefore === eastColor,
  );
  slowSampling = true;
  overview.syncAround(0, 0, 40);
  mesh.getColorAt(westInstance, color);
  const westAfter = color.getHex();
  mesh.getColorAt(eastInstance, color);
  const eastAfter = color.getHex();
  check(
    'zooming to a coarser overview reseeds unsampled cells from nearby terrain, not the screen center',
    westAfter === westColor && eastAfter === eastColor,
  );
  overview.dispose();
}

function checkStreamerKeepsBuiltChunksAcrossZoom(check: CheckReporter): void {
  const sampler = {
    tileAt: () => EMPTY_TILE,
    topVoxelTileIdAt: () => EMPTY_TILE,
    packedVoxelColumnAt: () => null,
    groundFacingAt: () => 0,
    ceilingTileAt: () => EMPTY_TILE,
    ceilingHeightAt: () => 0,
    elevationAt: () => 0,
    markersIn: () => [],
  } as unknown as WorldSampler;
  const tileAssets = { byId: () => undefined } as unknown as ReadOnlyTileAssets;
  const root = new THREE.Group();
  const streamer = new ChunkMeshStreamer(root, sampler, tileAssets, NO_EXTRA_MARKERS);
  for (let i = 0; i < 200 && root.children.length < 81; i++) streamer.streamAround(0, 0, 4);
  const builtCount = root.children.length;
  streamer.streamAround(0, 0, 2);
  check(
    'zooming in hides far chunks instead of discarding their meshes',
    root.children.length === builtCount && root.children.some((group) => !group.visible),
  );
  streamer.streamAround(0, 0, 4);
  check(
    'zooming back out reveals the kept chunks without rebuilding',
    root.children.length === builtCount && root.children.every((group) => group.visible),
  );
  streamer.streamAround(10_000, 10_000, 2);
  check(
    'chunks left far behind the focus are still dropped',
    root.children.length < builtCount,
  );
  streamer.dispose();
}
