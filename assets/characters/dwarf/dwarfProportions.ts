export const DWARF_SPRITE_SIZE = 128;

export const DWARF_SKELETON = {
  centerX: 64,
  crownY: 17,
  browY: 29,
  eyeY: 33,
  chinY: 47,
  neckY: 49,
  shoulderY: 55,
  chestY: 66,
  waistY: 79,
  hipY: 87,
  kneeY: 99,
  bootTopY: 106,
  groundY: 120,
  cloakHemY: 107,
  handY: 88,
  braidEndY: 94,
} as const;

export const DWARF_HEAD_HALF_HEIGHT = (DWARF_SKELETON.chinY - DWARF_SKELETON.crownY) / 2;
export const DWARF_HEAD_CENTER_Y = (DWARF_SKELETON.chinY + DWARF_SKELETON.crownY) / 2;
