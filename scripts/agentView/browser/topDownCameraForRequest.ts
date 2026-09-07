import type { FramedCamera } from '@/features/game/render/view3d/framedCamera';
import { topDownFramedCamera } from '@/features/game/render/view3d/topDownFramedCamera';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { WorldViewRequest } from '../worldViewRequest';

export function topDownCameraForRequest(
  request: WorldViewRequest,
  sampler: WorldSampler,
): FramedCamera {
  return topDownFramedCamera({
    x: request.x,
    y: request.y,
    groundElevation: sampler.elevationAt(request.x, request.y),
    width: request.width,
    height: request.height,
    cameraDistanceTiles: request.cameraDistanceTiles,
  });
}
