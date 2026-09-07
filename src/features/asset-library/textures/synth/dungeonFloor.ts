import { sameOnEveryFace, type MaterialSynth } from '../materialSynth';
import {
  distanceToTileMidlines,
  insetFromTileEdge,
  toneWithin,
  type BlockTone,
  type ToneBand,
} from './dungeonBlockTones';

const SEAM: BlockTone = { rgb: [150, 158, 176], relief: 0.18 };
const SEAM_SHADOW: BlockTone = { rgb: [198, 206, 222], relief: 0.5 };
const PAVER: BlockTone = { rgb: [246, 248, 253], relief: 0.72 };
const PAVER_SHADE: BlockTone = { rgb: [224, 230, 242], relief: 0.7 };

const TILE_SEAM: ToneBand[] = [
  { until: 0.03, tone: SEAM },
  { until: 0.055, tone: SEAM_SHADOW },
];
const PAVER_SEAM = 0.02;

export const dungeonFloor: MaterialSynth = sameOnEveryFace(
  'dungeonFloor',
  (x, y) => toneAt(x, y).rgb,
  (x, y) => toneAt(x, y).relief,
);

function toneAt(x: number, y: number): BlockTone {
  const edged = toneWithin(insetFromTileEdge(x, y), TILE_SEAM, PAVER);
  if (edged !== PAVER) return edged;
  if (distanceToTileMidlines(x, y) < PAVER_SEAM) return SEAM_SHADOW;
  return (x < 0.5) === (y < 0.5) ? PAVER : PAVER_SHADE;
}
