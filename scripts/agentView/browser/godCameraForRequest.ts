import type { FramedCamera } from '@/features/game/render/view3d/framedCamera';
import { godFramedCamera } from '@/features/game/render/view3d/godFramedCamera';
import type { WorldViewRequest } from '../worldViewRequest';

export function godCameraForRequest(request: WorldViewRequest): FramedCamera {
  return godFramedCamera(request);
}
