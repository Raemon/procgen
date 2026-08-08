import { darken, lighten } from '../colorMath';
import type { PixelPainter } from '../pixelCanvas';

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export function rectHolds(rect: PixelRect, x: number, y: number): boolean {
  return x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height;
}

export function rectPainter(rect: PixelRect, color: string): PixelPainter {
  return (x, y) => (rectHolds(rect, x, y) ? color : null);
}

export function clippedToRect(rect: PixelRect, painter: PixelPainter): PixelPainter {
  return (x, y) => (rectHolds(rect, x, y) ? painter(x, y) : null);
}

export function clippedOutsideRect(rect: PixelRect, painter: PixelPainter): PixelPainter {
  return (x, y) => (rectHolds(rect, x, y) ? null : painter(x, y));
}

export function beveledRectPainter(rect: PixelRect, color: string, relief: number): PixelPainter {
  return (x, y) => {
    if (!rectHolds(rect, x, y)) return null;
    if (x === rect.left || y === rect.top) return lighten(color, relief);
    if (isRightOrBottomEdge(rect, x, y)) return darken(color, relief);
    return color;
  };
}

export function discPainter(centre: PixelPoint, radius: number, color: string): PixelPainter {
  return (x, y) => (distanceBetween({ x, y }, centre) <= radius ? color : null);
}

export function ringPainter(
  centre: PixelPoint,
  outerRadius: number,
  innerRadius: number,
  color: string,
): PixelPainter {
  return (x, y) => (isWithinRing({ x, y }, centre, outerRadius, innerRadius) ? color : null);
}

export function barPainter(
  from: PixelPoint,
  to: PixelPoint,
  thickness: number,
  color: string,
): PixelPainter {
  return (x, y) => (distanceToSegment({ x, y }, from, to) <= thickness / 2 ? color : null);
}

function isRightOrBottomEdge(rect: PixelRect, x: number, y: number): boolean {
  return x === rect.left + rect.width - 1 || y === rect.top + rect.height - 1;
}

function isWithinRing(
  point: PixelPoint,
  centre: PixelPoint,
  outerRadius: number,
  innerRadius: number,
): boolean {
  const distance = distanceBetween(point, centre);
  return distance <= outerRadius && distance >= innerRadius;
}

function distanceBetween(point: PixelPoint, other: PixelPoint): number {
  return Math.hypot(point.x - other.x, point.y - other.y);
}

function distanceToSegment(point: PixelPoint, from: PixelPoint, to: PixelPoint): number {
  return distanceBetween(point, nearestPointOnSegment(point, from, to));
}

function nearestPointOnSegment(point: PixelPoint, from: PixelPoint, to: PixelPoint): PixelPoint {
  const [alongX, alongY] = [to.x - from.x, to.y - from.y];
  const lengthSquared = alongX * alongX + alongY * alongY;
  if (lengthSquared === 0) return from;
  const raw = ((point.x - from.x) * alongX + (point.y - from.y) * alongY) / lengthSquared;
  const clamped = Math.max(0, Math.min(1, raw));
  return { x: from.x + alongX * clamped, y: from.y + alongY * clamped };
}
