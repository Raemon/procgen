import { blendPixel, paintPixel, type SpriteCanvas } from '../paint/spriteCanvas';
import { packHex } from '@/features/asset-library/tiles/art/packedHex';
import type { GauntPose } from './gauntOnePose';
import type { GauntOneView } from './gauntOneView';

export const GAUNT_ONE_SPRITE_SIZE = 48;
export const GAUNT_CENTER = 24.5;
export const GAUNT_GROUND_ROW = 45;

export interface GauntFrame {
  canvas: SpriteCanvas;
  view: GauntOneView;
  pose: GauntPose;
}

export function strokeLine(
  canvas: SpriteCanvas,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
): void {
  const steps = Math.max(1, Math.round(Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY))));
  for (let step = 0; step <= steps; step++) {
    const along = step / steps;
    paintPixel(canvas, fromX + (toX - fromX) * along, fromY + (toY - fromY) * along, color);
  }
}

export function glowPixel(
  canvas: SpriteCanvas,
  x: number,
  y: number,
  core: string,
  halo: string,
): void {
  const packedHalo = packHex(halo);
  blendPixel(canvas, x - 1, y, packedHalo, 0.55);
  blendPixel(canvas, x + 1, y, packedHalo, 0.55);
  blendPixel(canvas, x, y - 1, packedHalo, 0.55);
  blendPixel(canvas, x, y + 1, packedHalo, 0.55);
  paintPixel(canvas, x, y, core);
}

export function skullCenterX(view: GauntOneView): number {
  return GAUNT_CENTER + craneOf(view);
}

export function craneOf(view: GauntOneView): number {
  return -2 * (1 - view.forward) + 5 * view.forward;
}
