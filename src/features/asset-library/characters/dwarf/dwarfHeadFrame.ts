import { liftedY, type DwarfPainting } from './dwarfPainting';
import { DWARF_HEAD_CENTER_Y, DWARF_HEAD_HALF_HEIGHT, DWARF_SKELETON } from './dwarfProportions';

export interface DwarfHeadFrame {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  crownY: number;
  chinY: number;
  faceTurn: number;
}

export function dwarfHeadFrame(painting: DwarfPainting): DwarfHeadFrame {
  const { anatomy, pose } = painting;
  return {
    centerX: DWARF_SKELETON.centerX + anatomy.headCenterX + pose.lean * 2,
    centerY: liftedY(painting, DWARF_HEAD_CENTER_Y),
    halfWidth: anatomy.headHalfWidth,
    halfHeight: DWARF_HEAD_HALF_HEIGHT,
    crownY: liftedY(painting, DWARF_SKELETON.crownY),
    chinY: liftedY(painting, DWARF_SKELETON.chinY),
    faceTurn: anatomy.faceTurn,
  };
}

export function faceFeatureX(head: DwarfHeadFrame, offset: number): number {
  return (
    head.centerX + head.faceTurn * head.halfWidth * 0.3 + offset * (1 - head.faceTurn * 0.5)
  );
}

export function faceFeatureY(head: DwarfHeadFrame, skeletonY: number): number {
  return head.centerY + (skeletonY - DWARF_HEAD_CENTER_Y);
}
