import type { MaterialSynth, TextureFace } from '../materialSynth';
import {
  insetFromTileEdge,
  litHalf,
  toneWithin,
  type BlockTone,
  type ToneBand,
} from './dungeonBlockTones';

const BEVEL: BlockTone = { rgb: [214, 218, 228], relief: 0.8 };
const SEAM: BlockTone = { rgb: [92, 96, 108], relief: 0.12 };
const FACE_LIT: BlockTone = { rgb: [138, 142, 156], relief: 0.58 };
const FACE: BlockTone = { rgb: [124, 128, 142], relief: 0.56 };
const PANEL: BlockTone = { rgb: [102, 106, 120], relief: 0.44 };

const CAP_BANDS: ToneBand[] = [
  { until: 0.075, tone: BEVEL },
  { until: 0.105, tone: SEAM },
];
const PANEL_INSET = 0.26;
const CAP_DEPTH = 0.09;
const CAP_SEAM_DEPTH = 0.125;
const FOOT_DEPTH = 0.93;
const CORNER_SEAM = 0.035;

export const dungeonWall: MaterialSynth = {
  id: 'dungeonWall',
  faces: ['top', 'side'],
  colorAt: (x, y, face) => toneAt(x, y, face).rgb,
  heightAt: (x, y, face) => toneAt(x, y, face).relief,
};

function toneAt(x: number, y: number, face: TextureFace): BlockTone {
  return face === 'side' ? sideToneAt(x, y) : capToneAt(x, y);
}

function capToneAt(x: number, y: number): BlockTone {
  const inset = insetFromTileEdge(x, y);
  const edged = toneWithin(inset, CAP_BANDS, FACE);
  if (edged !== FACE) return edged;
  if (inset > PANEL_INSET) return PANEL;
  return litHalf(x, y, FACE_LIT, FACE);
}

function sideToneAt(x: number, y: number): BlockTone {
  if (y < CAP_DEPTH) return BEVEL;
  if (y < CAP_SEAM_DEPTH || y > FOOT_DEPTH) return SEAM;
  if (x < CORNER_SEAM || x > 1 - CORNER_SEAM) return SEAM;
  return x < 0.5 ? FACE_LIT : FACE;
}
