import { pillarFaceArt } from '@/features/asset-library/tiles/art/fixtures/pillarArt';
import type { FixtureLook, LookPair } from './look';

export const PILLAR_FACE_ART = pillarFaceArt();
export const PILLAR_STANDS_TALL = 1.15;

const PILLAR: FixtureLook = {
  glyph: '■',
  color: '#7b7368',
  tag: 'pillar, immovable',
  faceArt: PILLAR_FACE_ART,
  standingHeight: PILLAR_STANDS_TALL,
};

export const PILLAR_LOOKS: LookPair = { off: PILLAR, on: PILLAR };
