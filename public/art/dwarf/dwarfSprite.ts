import type { SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import type { CharacterRotation } from '@/features/asset-library/characters/characterBillboard';
import { blankSpriteCanvas, spriteArtOf } from '../paint/spriteCanvas';
import { dwarfAnatomy } from './dwarfAnatomy';
import { moonAndEmberLighting, type DwarfPainting } from './dwarfPainting';
import { MOONLIT_DWARF_PALETTE, type DwarfPalette } from './dwarfPalette';
import type { DwarfPose } from './dwarfPose';
import { DWARF_SPRITE_SIZE } from './dwarfProportions';
import { paintDwarfArm } from './paintDwarfArms';
import { paintDwarfGroundGlow, paintDwarfMotes } from './paintDwarfAura';
import { paintDwarfCloak } from './paintDwarfCloak';
import { paintDwarfHairBehind, paintDwarfHairInFront } from './paintDwarfHair';
import { paintDwarfHead } from './paintDwarfHead';
import { paintDwarfLantern } from './paintDwarfLantern';
import { paintDwarfLegs } from './paintDwarfLegs';
import { paintDwarfTorso } from './paintDwarfTorso';

export function dwarfSprite(
  rotation: CharacterRotation,
  pose: DwarfPose,
  palette: DwarfPalette = MOONLIT_DWARF_PALETTE,
): SpriteArt {
  const painting: DwarfPainting = {
    canvas: blankSpriteCanvas(DWARF_SPRITE_SIZE),
    anatomy: dwarfAnatomy(rotation),
    pose,
    palette,
    lighting: moonAndEmberLighting(palette),
  };
  paintDwarfLayers(painting);
  return spriteArtOf(painting.canvas);
}

function paintDwarfLayers(painting: DwarfPainting): void {
  paintDwarfGroundGlow(painting);
  if (!painting.anatomy.cloakOverBody) paintDwarfCloak(painting);
  paintDwarfLegs(painting);
  paintDwarfArm(painting, 0);
  paintDwarfTorso(painting);
  if (painting.anatomy.cloakOverBody) paintDwarfCloak(painting);
  paintDwarfHairBehind(painting);
  paintDwarfHead(painting);
  paintDwarfHairInFront(painting);
  paintDwarfArm(painting, 1);
  paintDwarfLantern(painting);
  paintDwarfMotes(painting);
}
