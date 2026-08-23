import * as THREE from 'three';
import { cameraRelativeStep } from '../input/cameraRelativeStep';
import { PanOffset } from '../render/camera/panOffset';
import { ZoomScale } from '../render/camera/zoomScale';
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
