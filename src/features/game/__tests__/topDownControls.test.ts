import * as THREE from 'three';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { TopDownCamera } from '../render/view3d/topDownCamera';
import { facingRelativeStep } from '../input/facingRelativeStep';
import { movementAxisForKey } from '../input/movementKeys';
import {
  VIEW_MODES,
  commandModeOf,
  usesAgentText,
  usesCompassMovement,
  usesSightRadius,
  usesView3d,
  type ViewMode,
} from '../panel/viewMode';

export function checkTopDownControls(check: CheckReporter): void {
  check(
    'the picker offers both new views, since it reads the array and not the type',
    VIEW_MODES.includes('top-down') && VIEW_MODES.includes('agent-top-down'),
  );
  check(
    'top down is drawn in 3-D and its agent twin as text',
    usesView3d('top-down') && usesAgentText('agent-top-down') && !usesView3d('agent-top-down'),
  );
  check(
    'top down and both god views move by compass; the character views do not',
    ['top-down', 'agent-top-down', '3d-god', 'agent-god'].every((mode) =>
      usesCompassMovement(mode as ViewMode),
    ) &&
      !usesCompassMovement('character') &&
      !usesCompassMovement('agent-character'),
  );
  check(
    'top down carries the character sight knob, and the god views do not',
    usesSightRadius('top-down') && usesSightRadius('agent-top-down') && !usesSightRadius('3d-god'),
  );
  check(
    'each view asks the command layer in its own mode',
    commandModeOf('top-down') === 'topdown' &&
      commandModeOf('agent-top-down') === 'topdown' &&
      commandModeOf('character') === 'character' &&
      commandModeOf('3d-god') === 'god',
  );

  check(
    'sidestepping, A and D and the arrows beside them move rather than turn',
    movementAxisForKey('KeyA', true) === 'left' &&
      movementAxisForKey('ArrowRight', true) === 'right' &&
      movementAxisForKey('KeyA') === undefined &&
      movementAxisForKey('ArrowLeft') === undefined,
  );
  check(
    'W, S, Q and E mean the same thing under either scheme',
    (['KeyW', 'KeyS', 'KeyQ', 'KeyE'] as const).every(
      (code) => movementAxisForKey(code) === movementAxisForKey(code, true),
    ),
  );

  const compass = (forward: number, strafe: number) => facingRelativeStep(0, forward, strafe).join();
  check(
    'a compass step reads north up whatever the character faces',
    compass(1, 0) === '0,-1' &&
      compass(-1, 0) === '0,1' &&
      compass(0, 1) === '1,0' &&
      compass(0, -1) === '-1,0',
  );
  check(
    'holding two compass keys steps diagonally',
    compass(1, 1) === '1,-1' && compass(-1, -1) === '-1,1',
  );

  checkTheCameraLooksStraightDown(check);
}

function checkTheCameraLooksStraightDown(check: CheckReporter): void {
  const camera = new TopDownCamera();
  camera.setViewportSize(1200, 800);
  const frame = () => {
    camera.update(0, 4, -7, 0);
    camera.camera.updateMatrixWorld();
  };
  frame();
  const screen = (dx: number, dy: number) =>
    new THREE.Vector3(4.5 + dx, 0, -6.5 + dy).project(camera.camera);

  const onThePlayer = screen(0, 0);
  check(
    'the player sits at the exact center of the top-down frame',
    Math.abs(onThePlayer.x) < 1e-6 && Math.abs(onThePlayer.y) < 1e-6,
  );
  check(
    'the camera hangs directly above the player, not behind them',
    Math.abs(camera.camera.position.x - 4.5) < 1e-6 &&
      Math.abs(camera.camera.position.z + 6.5) < 1e-6 &&
      camera.camera.position.y > 0,
  );
  check(
    'north is up the screen and east is to the right, whatever the player faces',
    screen(0, -5).y > 0 && screen(0, 5).y < 0 && screen(5, 0).x > 0 && screen(-5, 0).x < 0,
  );
  check(
    'ground the same distance north and south lands the same distance from center',
    Math.abs(screen(0, -5).y + screen(0, 5).y) < 1e-6,
  );

  const beforeZoom = camera.visibleGroundRadiusTiles();
  camera.zoomByWheelPixels(420);
  frame();
  check('the wheel zooms the overhead camera out', camera.visibleGroundRadiusTiles() > beforeZoom);
  check(
    'zooming keeps the player centered',
    Math.abs(screen(0, 0).x) < 1e-6 && Math.abs(screen(0, 0).y) < 1e-6,
  );
}
