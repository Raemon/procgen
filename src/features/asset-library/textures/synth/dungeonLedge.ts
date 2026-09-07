import type { MaterialSynth, TextureFace } from '../materialSynth';
import {
  insetFromTileEdge,
  litHalf,
  toneWithin,
  type BlockTone,
  type ToneBand,
} from './dungeonBlockTones';

const LIP: BlockTone = { rgb: [252, 250, 244], relief: 0.86 };
const GROOVE: BlockTone = { rgb: [110, 96, 70], relief: 0.16 };
const DECK_LIT: BlockTone = { rgb: [190, 182, 162], relief: 0.62 };
const DECK: BlockTone = { rgb: [160, 152, 134], relief: 0.6 };
const PANEL: BlockTone = { rgb: [136, 128, 112], relief: 0.5 };
const FLANK_LIT: BlockTone = { rgb: [232, 224, 202], relief: 0.66 };
const FLANK: BlockTone = { rgb: [206, 198, 176], relief: 0.62 };

const DECK_BANDS: ToneBand[] = [
  { until: 0.1, tone: LIP },
  { until: 0.135, tone: GROOVE },
];
const PANEL_INSET = 0.28;
const LIP_DEPTH = 0.1;
const LIP_GROOVE_DEPTH = 0.14;
const FOOT_DEPTH = 0.93;
const CORNER_SEAM = 0.035;

export const dungeonLedge: MaterialSynth = {
  id: 'dungeonLedge',
  faces: ['top', 'side'],
  colorAt: (x, y, face) => toneAt(x, y, face).rgb,
  heightAt: (x, y, face) => toneAt(x, y, face).relief,
};

function toneAt(x: number, y: number, face: TextureFace): BlockTone {
  return face === 'side' ? sideToneAt(x, y) : deckToneAt(x, y);
}

function deckToneAt(x: number, y: number): BlockTone {
  const inset = insetFromTileEdge(x, y);
  const edged = toneWithin(inset, DECK_BANDS, DECK);
  if (edged !== DECK) return edged;
  if (inset > PANEL_INSET) return PANEL;
  return litHalf(x, y, DECK_LIT, DECK);
}

function sideToneAt(x: number, y: number): BlockTone {
  if (y < LIP_DEPTH) return LIP;
  if (y < LIP_GROOVE_DEPTH || y > FOOT_DEPTH) return GROOVE;
  if (x < CORNER_SEAM || x > 1 - CORNER_SEAM) return GROOVE;
  return x < 0.5 ? FLANK_LIT : FLANK;
}
