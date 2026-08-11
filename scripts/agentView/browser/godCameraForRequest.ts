import * as THREE from 'three';
import { FollowCamera } from '../../../world/render/view3d/followCamera';
import type { WorldViewRequest } from '../worldViewRequest';
import type { FramedCamera } from './framedCamera';
import { wheelPixelsReaching } from './wheelPixelsReaching';

const FACINGS_PER_QUADRANT = 2;

export function godCameraForRequest(request: WorldViewRequest): FramedCamera {
  const follow = zoomedFollowCamera(request);
  turnTowardFacing(follow, request.facing);
  return {
    camera: follow.camera,
    update: () => follow.update(0, request.x, request.y),
    focusPoint: () => follow.focusPoint(),
    visibleRadiusTiles: () => follow.visibleGroundRadiusTiles(),
    fogSightRadiusTiles: () => null,
  };
}

function zoomedFollowCamera(request: WorldViewRequest): FollowCamera {
  const follow = viewportSizedFollowCamera(request);
  if (request.cameraDistanceTiles === null) return follow;
  follow.zoomByWheelPixels(
    wheelPixelsReaching(request.cameraDistanceTiles, (wheelPixels) =>
      distanceAfterWheelPixels(request, wheelPixels),
    ),
  );
  return follow;
}

function distanceAfterWheelPixels(request: WorldViewRequest, wheelPixels: number): number {
  const trial = viewportSizedFollowCamera(request);
  trial.zoomByWheelPixels(wheelPixels);
  trial.update(0, request.x, request.y);
  const focus = trial.focusPoint();
  return trial.camera.position.distanceTo(new THREE.Vector3(focus.x + 0.5, 0, focus.y + 0.5));
}

function viewportSizedFollowCamera(request: WorldViewRequest): FollowCamera {
  const follow = new FollowCamera();
  follow.setViewportSize(request.width, request.height);
  return follow;
}

function turnTowardFacing(follow: FollowCamera, facing: number): void {
  const quadrant = Math.round(facing / FACINGS_PER_QUADRANT) % 4;
  for (let turn = 0; turn < quadrant; turn++) follow.rotate(1);
}
