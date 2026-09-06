import { leverIdleFaceArt, leverThrownFaceArt } from '@/features/asset-library/tiles/art/fixtures/leverArt';
import type { LookPair } from './look';

export const LEVER_FACE_ART = { off: leverIdleFaceArt(), on: leverThrownFaceArt() };
export const LEVER_STANDS_LOW = 0.7;

export const LEVER_LOOKS: LookPair = {
  off: {
    glyph: '⌐',
    color: '#9aa7b4',
    tag: 'lever, not yet pulled',
    faceArt: LEVER_FACE_ART.off,
    standingHeight: LEVER_STANDS_LOW,
  },
  on: {
    glyph: '¬',
    color: '#7fdc6a',
    tag: 'lever, pulled',
    faceArt: LEVER_FACE_ART.on,
    standingHeight: LEVER_STANDS_LOW,
  },
};
