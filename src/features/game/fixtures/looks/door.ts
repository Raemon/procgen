import { barredDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/barredDoorArt';
import { lockedDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/lockedDoorArt';
import { openDoorwayFaceArt } from '@/features/asset-library/tiles/art/fixtures/openDoorwayArt';
import type { DoorLock, FixtureLook, LookPair } from './look';

export const DOOR_FACE_ART = {
  key: lockedDoorFaceArt(),
  mechanism: barredDoorFaceArt(),
  on: openDoorwayFaceArt(),
};
export const DOOR_STANDS_TALL = 2;

export const DOOR_STANDS_OPEN: FixtureLook = {
  glyph: "'",
  color: '#6fb98a',
  tag: 'unlocked door, standing open',
  faceArt: DOOR_FACE_ART.on,
  standingHeight: DOOR_STANDS_TALL,
  seeThroughUnpaintedArt: true,
};

export const GATE_LOOKS: Record<DoorLock, LookPair> = {
  key: {
    off: {
      glyph: '+',
      color: '#e0b33c',
      tag: 'locked door, a keyhole in its brass plate',
      faceArt: DOOR_FACE_ART.key,
      standingHeight: DOOR_STANDS_TALL,
    },
    on: DOOR_STANDS_OPEN,
  },
  mechanism: {
    off: {
      glyph: '+',
      color: '#c05a4a',
      tag: 'door barred from within',
      faceArt: DOOR_FACE_ART.mechanism,
      standingHeight: DOOR_STANDS_TALL,
    },
    on: DOOR_STANDS_OPEN,
  },
};
