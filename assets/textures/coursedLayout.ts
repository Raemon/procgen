import { cellHash01 } from './synthSeeds';

export interface CoursedCell {
  blockId: number;
  jointDistance: number;
}

export function coursedBlockAt(
  x: number,
  y: number,
  courses: number,
  blocksPerCourse: number,
  seed: number,
): CoursedCell {
  const row = Math.floor(y * courses);
  const stagger = (row % 2) * 0.5;
  const column = Math.floor((x + stagger / blocksPerCourse) * blocksPerCourse);
  return {
    blockId: cellHash01(column, row, seed),
    jointDistance: jointDistanceOf(x, y, courses, blocksPerCourse, stagger),
  };
}

function jointDistanceOf(
  x: number,
  y: number,
  courses: number,
  blocksPerCourse: number,
  stagger: number,
): number {
  const rowFrac = fractional(y * courses);
  const columnFrac = fractional((x + stagger / blocksPerCourse) * blocksPerCourse);
  return Math.min(edgeDistance(rowFrac) * courses, edgeDistance(columnFrac) * blocksPerCourse);
}

function edgeDistance(frac: number): number {
  return Math.min(frac, 1 - frac);
}

function fractional(value: number): number {
  return value - Math.floor(value);
}
