import { paintPixel } from '../paint/spriteCanvas';
import { GAUNT_ONE_INKS as INK } from './gauntOnePalette';
import {
  GAUNT_CENTER,
  GAUNT_GROUND_ROW,
  strokeLine,
  type GauntFrame,
} from './gauntOneStrokes';

export function paintGauntLeg(frame: GauntFrame, side: number): void {
  const { view, pose, canvas } = frame;
  const swing = side < 0 ? pose.nearLegSwing : pose.farLegSwing;
  const lift = side < 0 ? pose.nearLegLift : pose.farLegLift;
  const ink = side < 0 ? INK.body : INK.bodyShadow;
  const hipX = GAUNT_CENTER + side * 1.5 * view.breadth;
  const hipY = 32 - pose.bodyLift;
  const kneeX =
    hipX + side * 3.2 * (1 - view.forward) * view.breadth + swing * 2.5 * view.forward - (1.5 + lift * 1.5) * view.forward;
  const kneeY = 37 - pose.bodyLift * 0.5 - lift;
  const footX = hipX + side * 3 * (1 - view.forward) * view.breadth + swing * 6 * view.forward;
  const footY = GAUNT_GROUND_ROW - lift * 2.5;
  const jagX = kneeX - side * (1 - view.forward) + swing * 1.2 * view.forward;
  const jagY = 41 - lift * 1.5;
  strokeLine(canvas, hipX, hipY, kneeX, kneeY, ink);
  strokeLine(canvas, kneeX, kneeY + 1, jagX, jagY, ink);
  strokeLine(canvas, jagX, jagY, footX, footY, ink);
  paintPixel(canvas, kneeX - side, kneeY, side < 0 ? INK.rim : INK.bodyShadow);
  paintPixel(canvas, footX + toeDirectionOf(frame, side, swing), footY, side < 0 ? INK.boneDark : INK.fingertip);
  if (side < 0) paintPixel(canvas, kneeX, kneeY + 2, INK.rim);
}

export function paintGauntArm(frame: GauntFrame, side: number): void {
  const { view, pose, canvas } = frame;
  const swing = -(side < 0 ? pose.nearLegSwing : pose.farLegSwing);
  const ink = side < 0 ? INK.body : INK.bodyShadow;
  const shoulderX = GAUNT_CENTER + side * 5 * view.breadth + (side > 0 ? 0.5 : 0);
  const shoulderY = 19 - (side > 0 ? 1 : 0) - pose.bodyLift;
  const elbowX = shoulderX + side * (1 - view.forward) + swing * 2.5 * view.forward;
  const elbowY = 25.5 - pose.bodyLift;
  const wristX = elbowX + side * 1.5 * (1 - view.forward) + swing * 4.5 * view.forward;
  const wristY = 34 - Math.abs(swing) * 1.2 * view.forward - pose.bodyLift * 0.5;
  strokeLine(canvas, shoulderX, shoulderY, elbowX, elbowY, ink);
  strokeLine(canvas, elbowX, elbowY + 1, wristX, wristY, ink);
  paintFingers(frame, wristX, wristY, ink, side);
  if (side < 0) {
    paintPixel(canvas, shoulderX, shoulderY, INK.rim);
    paintPixel(canvas, elbowX, elbowY + 1, INK.rim);
    paintPixel(canvas, wristX, wristY, INK.rim);
  }
}

function paintFingers(frame: GauntFrame, wristX: number, wristY: number, ink: string, side: number): void {
  for (const finger of [-1, 0, 1]) {
    const length = finger === 0 ? 3 : 2;
    const x = wristX + finger;
    strokeLine(frame.canvas, x, wristY + 1, x, wristY + length, ink);
    paintPixel(frame.canvas, x, wristY + length + 1, side < 0 ? INK.boneDark : INK.fingertip);
  }
}

function toeDirectionOf(frame: GauntFrame, side: number, swing: number): number {
  if (frame.view.forward > 0.3) return swing >= 0 ? 1 : -1;
  return -side;
}
