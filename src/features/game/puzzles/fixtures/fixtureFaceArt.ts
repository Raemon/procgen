import { TILE_ART_SIZE } from '@/features/asset-library/tiles/art/artSize';
import { DOOR_TOP_BAND } from '@/features/asset-library/tiles/art/fixtures/doorFrame';
import { leverIdleFaceArt, leverThrownFaceArt } from '@/features/asset-library/tiles/art/fixtures/leverArt';
import { lockedDoorFaceArt } from '@/features/asset-library/tiles/art/fixtures/lockedDoorArt';
import { openDoorwayFaceArt } from '@/features/asset-library/tiles/art/fixtures/openDoorwayArt';
export const DOOR_FACE_ART = { off: lockedDoorFaceArt(), on: openDoorwayFaceArt() };
export const LEVER_FACE_ART = { off: leverIdleFaceArt(), on: leverThrownFaceArt() };

export const DOOR_STANDS_TALL = 2;
export const DOOR_OPENS_TO_A_LEAF = DOOR_TOP_BAND.height / TILE_ART_SIZE;
export const LEVER_STANDS_LOW = 0.7;
