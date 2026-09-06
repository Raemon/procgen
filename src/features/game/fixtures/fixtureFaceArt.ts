import { crateFaceArt, crateOnPlateFaceArt } from '@/features/asset-library/tiles/art/fixtures/crateArt';
import { leverIdleFaceArt, leverThrownFaceArt } from '@/features/asset-library/tiles/art/fixtures/leverArt';
import { barredDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/barredDoorArt';
import { lockedDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/lockedDoorArt';
import { openDoorwayFaceArt } from '@/features/asset-library/tiles/art/fixtures/openDoorwayArt';
import { pillarFaceArt } from '@/features/asset-library/tiles/art/fixtures/pillarArt';
import { platePressedFaceArt, plateWaitingFaceArt } from '@/features/asset-library/tiles/art/fixtures/pressurePlateArt';
export const DOOR_FACE_ART = {
  key: lockedDoorFaceArt(),
  mechanism: barredDoorFaceArt(),
  on: openDoorwayFaceArt(),
};
export const LEVER_FACE_ART = { off: leverIdleFaceArt(), on: leverThrownFaceArt() };
export const CRATE_FACE_ART = { off: crateFaceArt(), on: crateOnPlateFaceArt() };
export const PLATE_FACE_ART = { off: plateWaitingFaceArt(), on: platePressedFaceArt() };
export const PILLAR_FACE_ART = pillarFaceArt();

export function crateFaceArtIn(core: string, charged: boolean) {
  return charged ? crateOnPlateFaceArt(core) : crateFaceArt(core);
}

export function plateFaceArtIn(signal: string, pressed: boolean) {
  return pressed ? platePressedFaceArt(signal) : plateWaitingFaceArt(signal);
}

export const DOOR_STANDS_TALL = 2;
export const LEVER_STANDS_LOW = 0.7;
export const CRATE_STANDS_SQUAT = 0.88;
export const PILLAR_STANDS_TALL = 1.15;
export const PLATE_LIES_FLAT = 0.16;
export const PLATE_SINKS_UNDER_A_CRATE = 0.08;
export const CRATE_FOOTPRINT = 0.84;
export const CHARGED_CRATE_GLOW = 0.8;
export const PRESSED_PLATE_GLOW = 0.7;
