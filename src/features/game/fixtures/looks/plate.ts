import { platePressedFaceArt, plateWaitingFaceArt } from '@/features/asset-library/tiles/art/fixtures/pressurePlateArt';
import type { LookPair } from './look';

export const PLATE_FACE_ART = { off: plateWaitingFaceArt(), on: platePressedFaceArt() };
export const PLATE_LIES_FLAT = 0.16;
export const PLATE_SINKS_UNDER_A_CRATE = 0.08;
export const PRESSED_PLATE_GLOW = 0.7;

export function plateFaceArtIn(signal: string, pressed: boolean) {
  return pressed ? platePressedFaceArt(signal) : plateWaitingFaceArt(signal);
}

export const PLATE_LOOKS: LookPair = {
  off: {
    glyph: '◻',
    color: '#f0b043',
    tag: 'pressure plate, waiting for a crate',
    faceArt: PLATE_FACE_ART.off,
    standingHeight: PLATE_LIES_FLAT,
  },
  on: {
    glyph: '◼',
    color: '#6fe08a',
    tag: 'pressure plate, weighted down and glowing',
    faceArt: PLATE_FACE_ART.on,
    standingHeight: PLATE_SINKS_UNDER_A_CRATE,
    glow: PRESSED_PLATE_GLOW,
  },
};
