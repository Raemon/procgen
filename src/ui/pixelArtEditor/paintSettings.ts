import { FLAT_HEIGHT_INK } from '../../world/tiles/faceArtHeight';
import type { ArtLayer } from '../../world/tiles/faceArtFrames';
import {
  DEFAULT_FACE_ART_SIZE,
  SIDE_FACES,
  type CubeFace,
  type CubeFaceArt,
} from '../../world/tiles/tileFaceArt';
import { sideFacesMatch } from './ops/linkedSideFaces';

export type FaceTab = CubeFace | 'sides';
export type PaintTool = 'draw' | 'erase' | 'fill' | 'pick';

export interface PaintSettings {
  faceTab: FaceTab;
  tool: PaintTool;
  paintColor: string;
  heightInk: string;
  layer: ArtLayer;
  frame: number;
  playing: boolean;
  mirrorX: boolean;
  mirrorY: boolean;
  linkedSides: boolean;
  size: number;
}

export function paintedLayerInk(settings: PaintSettings): string {
  return settings.layer === 'height' ? settings.heightInk : settings.paintColor;
}

export function initialPaintSettings(
  art: CubeFaceArt | null,
  baseColor: string,
  lockedFace?: CubeFace,
): PaintSettings {
  return {
    faceTab: lockedFace ?? 'top',
    tool: 'draw',
    paintColor: baseColor,
    heightInk: FLAT_HEIGHT_INK,
    layer: 'color',
    frame: 0,
    playing: false,
    mirrorX: false,
    mirrorY: false,
    linkedSides: art ? sideFacesMatch(art) : true,
    size: art?.size ?? DEFAULT_FACE_ART_SIZE,
  };
}

export function activeFace(settings: PaintSettings): CubeFace {
  return settings.faceTab === 'sides' ? 'north' : settings.faceTab;
}

export function targetFaces(settings: PaintSettings): readonly CubeFace[] {
  return settings.faceTab === 'sides' ? SIDE_FACES : [settings.faceTab];
}

export function isSideTab(tab: FaceTab): boolean {
  return tab === 'sides' || (SIDE_FACES as readonly string[]).includes(tab);
}
