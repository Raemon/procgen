import { sculptedInk, type SculptLighting, type SurfaceInk } from '../../creatures/art/paint/sculptedInk';
import type { SurfaceShade } from '../../creatures/art/paint/shapes';
import type { SpriteCanvas } from '../../creatures/art/paint/spriteCanvas';
import type { DwarfAnatomy } from './dwarfAnatomy';
import type { DwarfPalette } from './dwarfPalette';
import type { DwarfPose } from './dwarfPose';
import { DWARF_SKELETON } from './dwarfProportions';

export interface DwarfPainting {
  canvas: SpriteCanvas;
  anatomy: DwarfAnatomy;
  pose: DwarfPose;
  palette: DwarfPalette;
  lighting: SculptLighting;
}

export function moonAndEmberLighting(palette: DwarfPalette): SculptLighting {
  return {
    keyAcross: 0.72,
    keyAlong: 0.69,
    fill: 0.24,
    rimStrength: 0.85,
    underglow: palette.ember,
  };
}

export function surfaceOf(
  painting: DwarfPainting,
  ink: SurfaceInk,
  underglow = 0,
): SurfaceShade {
  return (across, along) => sculptedInk(ink, painting.lighting, across, along, underglow);
}

export function bodyX(painting: DwarfPainting, offset: number): number {
  return DWARF_SKELETON.centerX + painting.anatomy.torsoCenterX + offset;
}

export function liftedY(painting: DwarfPainting, y: number): number {
  return y + painting.pose.bob;
}
