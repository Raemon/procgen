import { paintPixel } from '../paint/spriteCanvas';
import { GAUNT_ONE_INKS as INK } from './gauntOnePalette';
import {
  GAUNT_CENTER,
  glowPixel,
  skullCenterX,
  strokeLine,
  type GauntFrame,
} from './gauntOneStrokes';

export function paintGauntSkull(frame: GauntFrame): void {
  const { view } = frame;
  if (view.face === 'none') return paintBackOfSkull(frame);
  const centerX = skullCenterX(view);
  const browY = browRowOf(frame);
  const span = 2.5 * Math.max(view.breadth, 0.55);
  strokeLine(frame.canvas, centerX - 1.5, browY - 1, centerX + 1.5, browY - 1, INK.boneDark);
  strokeLine(frame.canvas, centerX - span, browY, centerX + span, browY, INK.bone);
  paintPixel(frame.canvas, centerX - span, browY, INK.boneLit);
  paintPixel(frame.canvas, centerX + span, browY, INK.boneDark);
  strokeLine(frame.canvas, centerX - span, browY + 1, centerX + span, browY + 1, INK.orbit);
  strokeLine(frame.canvas, centerX - 1.5, browY + 2, centerX + 1.5, browY + 2, INK.bone);
  paintPixel(frame.canvas, centerX - 1.5, browY + 2, INK.boneLit);
  paintMuzzle(frame, centerX, browY);
  paintEyes(frame, centerX, browY + 1);
}

export function paintGauntNeck(frame: GauntFrame): void {
  const { view, pose } = frame;
  const topX = skullCenterX(view) + 1.5 * (1 - view.forward) - 2 * view.forward;
  const topY = 11 + pose.headDip - pose.bodyLift;
  const baseX = GAUNT_CENTER + 1.5 * (1 - view.forward) * view.breadth - 1.5 * view.forward;
  const baseY = 16.5 - pose.bodyLift;
  for (let step = 0; step <= 5; step++) {
    const along = step / 5;
    const x = topX + (baseX - topX) * along;
    const y = topY + (baseY - topY) * along;
    paintPixel(frame.canvas, x, y, INK.body);
    paintPixel(frame.canvas, x + 1, y, INK.bodyShadow);
  }
}

export function paintGauntAntlers(frame: GauntFrame): void {
  paintAntler(frame, -1);
  paintAntler(frame, 1);
}

function browRowOf(frame: GauntFrame): number {
  return 8 + frame.pose.headDip - frame.pose.bodyLift;
}

function paintBackOfSkull(frame: GauntFrame): void {
  const centerX = skullCenterX(frame.view);
  const browY = browRowOf(frame);
  const halfWidths = [1.5, 2.5, 2.5, 1.5];
  halfWidths.forEach((halfWidth, row) => {
    const y = browY - 1 + row;
    strokeLine(frame.canvas, centerX - halfWidth, y, centerX + halfWidth, y, INK.body);
    paintPixel(frame.canvas, centerX - halfWidth, y, INK.rim);
    paintPixel(frame.canvas, centerX + halfWidth, y, INK.bodyShadow);
  });
}

function paintMuzzle(frame: GauntFrame, centerX: number, browY: number): void {
  const { view } = frame;
  const halfWidths = [1.5, 1, 1, 0.5];
  halfWidths.forEach((halfWidth, row) => {
    const y = browY + 3 + row;
    const drift = -0.5 * (1 - view.forward) + (row + 1) * 1.1 * view.forward;
    const ink = row < 2 ? INK.bone : INK.boneDark;
    strokeLine(frame.canvas, centerX + drift - halfWidth, y, centerX + drift + halfWidth, y, ink);
  });
  paintPixel(frame.canvas, centerX + 4.9 * view.forward - 0.5 * (1 - view.forward), browY + 6, INK.boneDark);
}

function paintEyes(frame: GauntFrame, centerX: number, orbitY: number): void {
  if (frame.view.face === 'near') {
    return glowPixel(frame.canvas, centerX + 1.2, orbitY, INK.eye, INK.eyeHalo);
  }
  const offset = 1.5 * Math.max(frame.view.breadth, 0.7);
  glowPixel(frame.canvas, centerX - offset, orbitY, INK.eye, INK.eyeHalo);
  glowPixel(frame.canvas, centerX + offset, orbitY, INK.eye, INK.eyeHalo);
}

function paintAntler(frame: GauntFrame, side: number): void {
  const { view, canvas } = frame;
  const rootX = skullCenterX(view) + side * 2.4 * Math.max(view.breadth, 0.45);
  const rootY = 7 + frame.pose.headDip - frame.pose.bodyLift;
  const sweep = side * 0.5 * (1 - view.forward) - 0.85 * view.forward;
  const beamInk = side < 0 ? INK.antlerLit : INK.antler;
  let beamX = rootX;
  for (let rise = 0; rise <= 5; rise++) {
    beamX = rootX + sweep * rise * 0.6;
    paintPixel(canvas, beamX, rootY - rise, rise === 5 ? INK.antlerDark : beamInk);
    if (rise === 3) paintFork(frame, beamX, rootY - rise, side);
    if (rise === 4 && side > 0) paintPixel(canvas, beamX + 1 - 2 * view.forward, rootY - rise + 1, INK.antlerDark);
  }
  paintPixel(canvas, rootX + side, rootY, INK.antler);
  if (side < 0) paintPixel(canvas, beamX - sweep + side * -1, rootY - 4, INK.antlerDark);
}

function paintFork(frame: GauntFrame, x: number, y: number, side: number): void {
  const { view, canvas } = frame;
  const forkDir = side * (1 - view.forward) - view.forward;
  const length = side > 0 ? 3 : 2;
  for (let reach = 1; reach <= length; reach++) {
    const ink = reach === length ? INK.antlerDark : INK.antler;
    paintPixel(canvas, x + forkDir * reach, y - Math.ceil(reach / 2), ink);
  }
}
