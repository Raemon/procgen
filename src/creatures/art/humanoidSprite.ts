import type { SpriteArt } from '../../world/tiles/spriteArt';
import type { CharacterRotation } from '../character/characterBillboard';
import type { HumanoidPalette } from './humanoidPalette';
import { humanoidView, type HumanoidView } from './humanoidView';
import { blankSpriteCanvas, paintPixel, paintRect, spriteArtOf, type SpriteCanvas } from './paint/spriteCanvas';

export const HUMANOID_SPRITE_SIZE = 16;

const HEAD_TOP = 2;
const HEAD_HEIGHT = 4;
const BODY_TOP = 6;
const BODY_HEIGHT = 5;
const LEG_TOP = 11;
const LEG_HEIGHT = 4;
const BOOT_ROW = 15;

export interface HumanoidPose {
  rotation: CharacterRotation;
  stride: number;
  bob: number;
}

export function humanoidSprite(pose: HumanoidPose, palette: HumanoidPalette): SpriteArt {
  const canvas = blankSpriteCanvas(HUMANOID_SPRITE_SIZE);
  const view = humanoidView(pose.rotation);
  paintLegs(canvas, view, palette, pose.stride);
  paintTorso(canvas, view, palette, pose.bob);
  paintArms(canvas, view, palette, pose.stride, pose.bob);
  paintHead(canvas, view, palette, pose.bob);
  return spriteArtOf(canvas);
}

function paintHead(
  canvas: SpriteCanvas,
  view: HumanoidView,
  palette: HumanoidPalette,
  bob: number,
): void {
  const top = HEAD_TOP + bob;
  paintRect(canvas, view.headX, top, view.headWidth, HEAD_HEIGHT, palette.skin);
  paintRect(canvas, view.headX, top, view.headWidth, view.hairFront ? HEAD_HEIGHT : 1, palette.hair);
  for (const column of view.eyeColumns) paintPixel(canvas, column, top + 2, palette.eyes);
  if (view.noseColumn !== null) paintPixel(canvas, view.noseColumn, top + 2, palette.skin);
}

function paintTorso(
  canvas: SpriteCanvas,
  view: HumanoidView,
  palette: HumanoidPalette,
  bob: number,
): void {
  const top = BODY_TOP + bob;
  paintRect(canvas, view.bodyX, top, view.bodyWidth, BODY_HEIGHT, palette.tunic);
  paintRect(canvas, view.bodyX, top + BODY_HEIGHT - 1, view.bodyWidth, 1, palette.trim);
}

function paintArms(
  canvas: SpriteCanvas,
  view: HumanoidView,
  palette: HumanoidPalette,
  stride: number,
  bob: number,
): void {
  view.armColumns.forEach((column, index) => {
    const swing = index === 0 ? -stride : stride;
    const top = BODY_TOP + bob + Math.max(0, swing);
    paintRect(canvas, column, top, 1, 3, palette.tunic);
    paintPixel(canvas, column, top + 3, palette.skin);
  });
}

function paintLegs(
  canvas: SpriteCanvas,
  view: HumanoidView,
  palette: HumanoidPalette,
  stride: number,
): void {
  view.legColumns.forEach((column, index) => {
    const swing = index === 0 ? stride : -stride;
    const x = column + (view.legsSwingSideways ? swing : 0);
    const spread = view.legsSwingSideways ? 0 : swing;
    paintRect(canvas, x + spread, LEG_TOP, 2, LEG_HEIGHT, palette.legs);
    paintRect(canvas, x + spread, BOOT_ROW, 2, 1, palette.boots);
  });
}
