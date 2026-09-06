import { ARCANE_CORE, crateFaceArt, crateOnPlateFaceArt } from '@/features/asset-library/tiles/art/fixtures/crateArt';
import type { LookPair } from './look';

export const CRATE_FACE_ART = { off: crateFaceArt(), on: crateOnPlateFaceArt() };
export const CRATE_STANDS_SQUAT = 0.88;
export const CRATE_FOOTPRINT = 0.84;
export const CHARGED_CRATE_GLOW = 0.8;

export function crateFaceArtIn(core: string, charged: boolean) {
  return charged ? crateOnPlateFaceArt(core) : crateFaceArt(core);
}

export const CRATE_LOOKS: LookPair = {
  off: {
    glyph: '▣',
    color: ARCANE_CORE,
    tag: 'crate: a caged power core, push it by walking into it',
    faceArt: CRATE_FACE_ART.off,
    standingHeight: CRATE_STANDS_SQUAT,
    footprint: CRATE_FOOTPRINT,
  },
  on: {
    glyph: '▩',
    color: ARCANE_CORE,
    tag: 'crate, its power core charged on the pressure plate beneath it',
    faceArt: CRATE_FACE_ART.on,
    standingHeight: CRATE_STANDS_SQUAT,
    footprint: CRATE_FOOTPRINT,
    glow: CHARGED_CRATE_GLOW,
  },
};
