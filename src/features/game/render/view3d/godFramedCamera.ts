import * as THREE from 'three';
import { facingYawRadians, type FacingIndex } from '../../facing';
import { FollowCamera } from './followCamera';
import type { FramedCamera } from './framedCamera';
import { wheelPixelsReaching } from './wheelPixelsReaching';

export interface GodShotFrame {
  x: number;
  y: number;
  facing: FacingIndex;
  width: number;
  height: number;
  cameraDistanceTiles: number | null;
}

export function godFramedCamera(frame: GodShotFrame): FramedCamera {
  const follow = zoomedFollowCamera(frame);
  return {
    camera: follow.camera,
    update: () => follow.update(0, frame.x, frame.y, facingYawRadians(frame.facing)),
    focusPoint: () => follow.focusPoint(),
    visibleRadiusTiles: () => follow.visibleGroundRadiusTiles(),
    fogSightRadiusTiles: () => null,
  };
}

function zoomedFollowCamera(frame: GodShotFrame): FollowCamera {
  const follow = viewportSizedFollowCamera(frame);
  if (frame.cameraDistanceTiles === null) return follow;
  follow.zoomByWheelPixels(
    wheelPixelsReaching(frame.cameraDistanceTiles, (wheelPixels) =>
      distanceAfterWheelPixels(frame, wheelPixels),
    ),
  );
  return follow;
}

function distanceAfterWheelPixels(frame: GodShotFrame, wheelPixels: number): number {
  const trial = viewportSizedFollowCamera(frame);
  trial.zoomByWheelPixels(wheelPixels);
  trial.update(0, frame.x, frame.y, facingYawRadians(frame.facing));
  const focus = trial.focusPoint();
  return trial.camera.position.distanceTo(new THREE.Vector3(focus.x + 0.5, 0, focus.y + 0.5));
}

function viewportSizedFollowCamera(frame: GodShotFrame): FollowCamera {
  const follow = new FollowCamera();
  follow.setViewportSize(frame.width, frame.height);
  return follow;
}
