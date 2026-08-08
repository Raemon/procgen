import type { WorldSampler } from '../../../procgen/worldSampler';
import { facingYawRadians } from '../../../world/facing';
import { CharacterCamera } from '../../../world/render/view3d/characterCamera';
import {
  clampSightRadiusTiles,
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
} from '../../../world/vision/characterSight';
import type { WorldViewRequest } from '../worldViewRequest';
import type { FramedCamera } from './framedCamera';
import { wheelPixelsReaching } from './wheelPixelsReaching';

export function characterCameraForRequest(
  request: WorldViewRequest,
  sampler: WorldSampler,
): FramedCamera {
  const sightRadius = clampSightRadiusTiles(
    request.sightRadiusTiles ?? DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  );
  const eyes = zoomedCharacterCamera(request);
  eyes.setAspect(request.width / request.height);
  eyes.setSightRadiusTiles(sightRadius);
  return {
    camera: eyes.camera,
    update: () => standAndLook(eyes, request, sampler.elevationAt(request.x, request.y)),
    focusPoint: () => eyes.focusPoint(),
    visibleRadiusTiles: () => sightRadius,
    fogSightRadiusTiles: () => sightRadius,
  };
}

function standAndLook(eyes: CharacterCamera, request: WorldViewRequest, elevation: number): void {
  eyes.update(0, request.x, request.y, elevation, facingYawRadians(request.facing));
}

function zoomedCharacterCamera(request: WorldViewRequest): CharacterCamera {
  const eyes = new CharacterCamera();
  if (request.fieldOfViewDeg === null) return eyes;
  eyes.zoomByWheelPixels(
    wheelPixelsReaching(request.fieldOfViewDeg, (wheelPixels) =>
      fieldOfViewAfterWheelPixels(request, wheelPixels),
    ),
  );
  return eyes;
}

function fieldOfViewAfterWheelPixels(request: WorldViewRequest, wheelPixels: number): number {
  const trial = new CharacterCamera();
  trial.zoomByWheelPixels(wheelPixels);
  standAndLook(trial, request, 0);
  return trial.camera.fov;
}
