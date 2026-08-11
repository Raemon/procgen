import { cameraRelativeStep } from '../world/input/cameraRelativeStep';
import { PanOffset } from '../world/render/camera/panOffset';
import { ZoomScale } from '../world/render/camera/zoomScale';
import { worldPanForDrag } from '../world/render/view3d/dragToWorldPan';
import { streamingRadiusChunks } from '../world/render/view3d/streamingRadius';
import type { CheckReporter } from './checkReporter';

export function checkCameraMovementAndZoom(check: CheckReporter): void {
  check('forward faces north with the camera at north', String(cameraRelativeStep(0, 1, 0)) === '0,-1');
  check('forward faces east with the camera turned right', String(cameraRelativeStep(1, 1, 0)) === '1,0');
  check('strafing right of south faces west', String(cameraRelativeStep(2, 0, 1)) === '-1,0');

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
}
