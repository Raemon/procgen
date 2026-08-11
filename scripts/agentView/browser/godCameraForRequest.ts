import * as THREE from 'three';
import { facingYawRadians } from '@/features/game/facing';
import { FollowCamera } from '@/features/game/render/view3d/followCamera';
import type { WorldViewRequest } from '../worldViewRequest';
import type { FramedCamera } from './framedCamera';
import { wheelPixelsReaching } from './wheelPixelsReaching';

export function godCameraForRequest(request: WorldViewRequest): FramedCamera {
  const follow = zoomedFollowCamera(request);
  return {
    camera: follow.camera,
    update: () => follow.update(0, request.x, request.y, facingYawRadians(request.facing)),
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
  trial.update(0, request.x, request.y, facingYawRadians(request.facing));
  const focus = trial.focusPoint();
  return trial.camera.position.distanceTo(new THREE.Vector3(focus.x + 0.5, 0, focus.y + 0.5));
}

function viewportSizedFollowCamera(request: WorldViewRequest): FollowCamera {
  const follow = new FollowCamera();
  follow.setViewportSize(request.width, request.height);
  return follow;
}
