import {
  DEFAULT_FACE_ART_SIZE,
  SIDE_FACES,
  type CubeFace,
  type CubeFaceArt,
} from '../../world/tiles/tileFaceArt';
import { sideFacesMatch } from './ops/linkedSideFaces';

export type FaceTab = CubeFace | 'sides';
export type PaintTool = 'draw' | 'erase' | 'fill' | 'pick';

export interface PaintState {
  faceTab: FaceTab;
  tool: PaintTool;
  paintColor: string;
  mirrorX: boolean;
  mirrorY: boolean;
  linkedSides: boolean;
  size: number;
}

export function initialPaintState(art: CubeFaceArt | null, baseColor: string): PaintState {
  return {
    faceTab: 'top',
    tool: 'draw',
    paintColor: baseColor,
    mirrorX: false,
    mirrorY: false,
    linkedSides: art ? sideFacesMatch(art) : true,
    size: art?.size ?? DEFAULT_FACE_ART_SIZE,
  };
}

export function activeFace(state: PaintState): CubeFace {
  return state.faceTab === 'sides' ? 'north' : state.faceTab;
}

export function targetFaces(state: PaintState): readonly CubeFace[] {
  return state.faceTab === 'sides' ? SIDE_FACES : [state.faceTab];
}

export function isSideTab(tab: FaceTab): boolean {
  return tab === 'sides' || (SIDE_FACES as readonly string[]).includes(tab);
}
