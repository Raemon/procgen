import { leverIdleFaceArt, leverThrownFaceArt } from '@/features/asset-library/tiles/art/fixtures/leverArt';
import { lockedDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/lockedDoorArt';
import { openDoorwayFaceArt } from '@/features/asset-library/tiles/art/fixtures/openDoorwayArt';
export const DOOR_FACE_ART = { off: lockedDoorFaceArt(), on: openDoorwayFaceArt() };
export const LEVER_FACE_ART = { off: leverIdleFaceArt(), on: leverThrownFaceArt() };

export const DOOR_STANDS_TALL = 2;
export const LEVER_STANDS_LOW = 0.7;
