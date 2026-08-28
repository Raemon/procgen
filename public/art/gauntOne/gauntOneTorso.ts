import { paintPixel } from '../paint/spriteCanvas';
import { GAUNT_ONE_INKS as INK } from './gauntOnePalette';
import { GAUNT_CENTER, type GauntFrame } from './gauntOneStrokes';

const TORSO_TOP_ROW = 17;

const TORSO_ROWS: ReadonlyArray<readonly [drift: number, halfWidth: number]> = [
  [3, 2],
  [1, 4.5],
  [0.5, 5],
  [0.5, 4],
  [0, 3.5],
  [0.5, 3],
  [0, 2.5],
  [0, 2.5],
  [0, 2.5],
  [-0.5, 2],
  [0, 1.5],
  [0, 1.5],
  [0, 1.5],
  [0, 1.5],
  [0, 2],
  [-0.5, 1.5],
];

export function paintGauntTorso(frame: GauntFrame): void {
  TORSO_ROWS.forEach((row, index) => paintTorsoRow(frame, index, row[0], row[1]));
  paintBellyHollow(frame);
  if (frame.view.spineRidge) paintSpineRidge(frame);
  else if (frame.view.forward < 1) paintRibGlints(frame);
}

function torsoCenterAt(frame: GauntFrame, y: number, drift: number): number {
  const { view } = frame;
  return GAUNT_CENTER + drift * (1 - view.forward) * view.breadth + backBulgeAt(y) * view.forward;
}

function backBulgeAt(y: number): number {
  if (y <= 21) return -(2.5 - (y - TORSO_TOP_ROW) * 0.4);
  return y <= 26 ? -0.5 : 0;
}

function paintTorsoRow(frame: GauntFrame, index: number, drift: number, halfWidth: number): void {
  const y = TORSO_TOP_ROW + index - frame.pose.bodyLift;
  const center = torsoCenterAt(frame, TORSO_TOP_ROW + index, drift);
  const width = Math.max(1, halfWidth * Math.max(frame.view.breadth, 0.42));
  const left = Math.round(center - width);
  const right = Math.round(center + width);
  for (let x = left; x <= right; x++) {
    const ink = x === left ? INK.rim : x > center + width - 1.5 ? INK.bodyShadow : INK.body;
    paintPixel(frame.canvas, x, y, ink);
  }
}

function paintBellyHollow(frame: GauntFrame): void {
  const { view, pose } = frame;
  for (let y = 22; y <= 29; y++) {
    const center = torsoCenterAt(frame, y, 0);
    const width = Math.max(1, 2.5 * Math.max(view.breadth, 0.42));
    const hollowX = (GAUNT_CENTER - 0.5) * (1 - view.forward) + (center + width - 1) * view.forward;
    paintPixel(frame.canvas, hollowX, y - pose.bodyLift, INK.bodyShadow);
  }
}

function paintRibGlints(frame: GauntFrame): void {
  const { view, pose } = frame;
  const spread = Math.max(view.breadth, 0.6);
  for (const y of [21, 23, 25]) {
    paintPixel(frame.canvas, GAUNT_CENTER - 2.5 * spread, y - pose.bodyLift, INK.boneDark);
    paintPixel(frame.canvas, GAUNT_CENTER - 1.5 * spread, y - pose.bodyLift, INK.ribNear);
    paintPixel(frame.canvas, GAUNT_CENTER + 1.5 * spread, y - pose.bodyLift, INK.ribFar);
  }
  paintPixel(frame.canvas, GAUNT_CENTER - 1.5 * spread, 27 - pose.bodyLift, INK.ribNear);
}

function paintSpineRidge(frame: GauntFrame): void {
  for (let y = 18; y <= 30; y++) {
    const x = torsoCenterAt(frame, y, 0) + 0.4;
    const ink = (y - 19) % 3 === 0 ? INK.boneDark : INK.bodyShadow;
    paintPixel(frame.canvas, x, y - frame.pose.bodyLift, ink);
  }
}
