import { sideFacesMatch } from '../../world/tiles/faceArtOps/linkedSideFaces';
import type { TileDef } from '../../world/tiles/tileDef';
import {
  DEFAULT_FACE_ART_SIZE,
  SIDE_FACES,
  type CubeFace,
} from '../../world/tiles/tileFaceArt';

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

export function initialPaintState(tile: TileDef): PaintState {
  return {
    faceTab: 'top',
    tool: 'draw',
    paintColor: tile.color,
    mirrorX: false,
    mirrorY: false,
    linkedSides: tile.faceArt ? sideFacesMatch(tile.faceArt) : true,
    size: tile.faceArt?.size ?? DEFAULT_FACE_ART_SIZE,
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
