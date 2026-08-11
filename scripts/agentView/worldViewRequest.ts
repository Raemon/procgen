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
  showCeilings: boolean;
  sightRadiusTiles: number | null;
}

export const DEFAULT_WORLD_NAME = 'volcanic islands';
export const REPO_PIPELINE_WORLD_NAME = 'repo';
