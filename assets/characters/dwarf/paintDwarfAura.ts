import { mixInk } from '../../tiles/art/packedHex';
import { paintEllipse } from '../../creatures/art/paint/shapes';
import { dwarfLanternPoint } from './dwarfLanternPoint';
import { bodyX, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const MOTE_COUNT = 9;
const MOTE_RISE = 34;
const MOTE_SPREAD = 13;

export function paintDwarfGroundGlow(painting: DwarfPainting): void {
  const { palette, pose } = painting;
  const heat = 0.55 + pose.auraPulse * 0.45;
  paintEllipse(
    painting.canvas,
    {
      centerX: bodyX(painting, 1),
      centerY: DWARF_SKELETON.groundY + 2,
      radiusX: 26 + pose.auraPulse * 2,
      radiusY: 7,
      feather: 3,
    },
    (across, along) => {
      const nearness = 1 - Math.min(1, radialDistance(across, along));
      return mixInk(palette.groundShadow, palette.ember, nearness * nearness * heat * 0.7);
    },
  );
}

export function paintDwarfMotes(painting: DwarfPainting): void {
  const lantern = dwarfLanternPoint(painting);
  for (let index = 0; index < MOTE_COUNT; index++) paintMote(painting, lantern, index);
}

function paintMote(
  painting: DwarfPainting,
  lantern: { centerX: number; centerY: number },
  index: number,
): void {
  const { palette, pose } = painting;
  const life = wrapUnit(pose.motePhase * driftSpeed(index) + scatter(index, 7));
  const drift = Math.sin(life * Math.PI * 2 + index) * 2.5;
  paintEllipse(
    painting.canvas,
    {
      centerX: lantern.centerX + (scatter(index, 3) - 0.5) * MOTE_SPREAD + drift,
      centerY: lantern.centerY - 4 - life * MOTE_RISE,
      radiusX: 1.3 - life * 0.6,
      radiusY: 1.3 - life * 0.6,
      feather: 1.7,
      opacity: Math.min(1, (1 - life) * 1.8),
    },
    () => mixInk(palette.emberCore, palette.ember, scatter(index, 13)),
  );
}

function driftSpeed(index: number): number {
  return 0.7 + scatter(index, 11) * 0.8;
}

function scatter(index: number, salt: number): number {
  const mixed = Math.sin((index + 1) * salt * 12.9898) * 43758.5453;
  return mixed - Math.floor(mixed);
}

function wrapUnit(value: number): number {
  return value - Math.floor(value);
}

function radialDistance(across: number, along: number): number {
  return Math.sqrt(across * across + along * along);
}
