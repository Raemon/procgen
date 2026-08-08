import type { FacingIndex } from '../../world/facing';

export type WorldViewStyle = 'god' | 'character';

export interface WorldViewRequest {
  worldName: string;
  x: number;
  y: number;
  facing: FacingIndex;
  style: WorldViewStyle;
  cameraDistanceTiles: number | null;
  fieldOfViewDeg: number | null;
  width: number;
  height: number;
}

export const DEFAULT_WORLD_NAME = 'thatchmere vale';
export const REPO_PIPELINE_WORLD_NAME = 'repo';
