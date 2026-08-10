import { blendPixel, type SpriteCanvas } from './spriteCanvas';

export type SurfaceShade = (across: number, along: number) => number;

export interface EllipseSpec {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  opacity?: number;
  feather?: number;
}

export interface CapsuleSpec {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromRadius: number;
  toRadius: number;
  opacity?: number;
}

interface ColumnEdges {
  top: number;
  bottom: number;
}

export interface ColumnBandSpec {
  leftX: number;
  rightX: number;
  edgesAt(x: number): ColumnEdges | null;
  opacity?: number;
}

export function paintEllipse(canvas: SpriteCanvas, spec: EllipseSpec, shade: SurfaceShade): void {
  const opacity = spec.opacity ?? 1;
  const feather = spec.feather ?? Math.min(spec.radiusX, spec.radiusY);
  forEachPixelInBox(canvas, spec.centerX, spec.centerY, spec.radiusX, spec.radiusY, (x, y) => {
    const across = (x - spec.centerX) / spec.radiusX;
    const along = (y - spec.centerY) / spec.radiusY;
    const distance = Math.sqrt(across * across + along * along);
    const coverage = clampUnitCoverage((1 - distance) * feather);
    if (coverage <= 0) return;
    blendPixel(canvas, x, y, shade(across, along), coverage * opacity);
  });
}

export function paintCapsule(canvas: SpriteCanvas, spec: CapsuleSpec, shade: SurfaceShade): void {
  const opacity = spec.opacity ?? 1;
  const spanX = spec.toX - spec.fromX;
  const spanY = spec.toY - spec.fromY;
  const spanLengthSquared = Math.max(1e-6, spanX * spanX + spanY * spanY);
  const widest = Math.max(spec.fromRadius, spec.toRadius);
  const centerX = (spec.fromX + spec.toX) / 2;
  const centerY = (spec.fromY + spec.toY) / 2;
  forEachPixelInBox(
    canvas,
    centerX,
    centerY,
    Math.abs(spanX) / 2 + widest + 1,
    Math.abs(spanY) / 2 + widest + 1,
    (x, y) => {
      const projected = ((x - spec.fromX) * spanX + (y - spec.fromY) * spanY) / spanLengthSquared;
      const along = clampUnitRange(projected);
      const nearestX = spec.fromX + spanX * along;
      const nearestY = spec.fromY + spanY * along;
      const radius = spec.fromRadius + (spec.toRadius - spec.fromRadius) * along;
      const offsetX = x - nearestX;
      const offsetY = y - nearestY;
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      const coverage = clampUnitCoverage(radius - distance);
      if (coverage <= 0) return;
      const side = sideOfSegment(offsetX, offsetY, spanX, spanY);
      blendPixel(canvas, x, y, shade((side * distance) / radius, along * 2 - 1), coverage * opacity);
    },
  );
}

export interface RowBandSpec {
  topY: number;
  bottomY: number;
  centerAt(y: number): number;
  halfWidthAt(y: number): number;
  opacity?: number;
}

export function paintRowBand(canvas: SpriteCanvas, spec: RowBandSpec, shade: SurfaceShade): void {
  const opacity = spec.opacity ?? 1;
  const top = Math.max(0, Math.floor(spec.topY));
  const bottom = Math.min(canvas.size - 1, Math.ceil(spec.bottomY));
  const height = Math.max(1e-6, spec.bottomY - spec.topY);
  for (let y = top; y <= bottom; y++) {
    const halfWidth = spec.halfWidthAt(y);
    if (halfWidth <= 0) continue;
    const center = spec.centerAt(y);
    const rowCoverage = clampUnitCoverage(Math.min(y + 0.5 - spec.topY, spec.bottomY - y + 0.5));
    if (rowCoverage <= 0) continue;
    const along = ((y - spec.topY) / height) * 2 - 1;
    paintRow(canvas, y, center, halfWidth, along, rowCoverage * opacity, shade);
  }
}

function paintRow(
  canvas: SpriteCanvas,
  y: number,
  center: number,
  halfWidth: number,
  along: number,
  opacity: number,
  shade: SurfaceShade,
): void {
  const left = Math.max(0, Math.floor(center - halfWidth));
  const right = Math.min(canvas.size - 1, Math.ceil(center + halfWidth));
  for (let x = left; x <= right; x++) {
    const coverage = clampUnitCoverage(
      Math.min(x + 0.5 - (center - halfWidth), center + halfWidth - x + 0.5),
    );
    if (coverage <= 0) continue;
    blendPixel(canvas, x, y, shade((x - center) / halfWidth, along), coverage * opacity);
  }
}

export function paintColumnBand(
  canvas: SpriteCanvas,
  spec: ColumnBandSpec,
  shade: SurfaceShade,
): void {
  const opacity = spec.opacity ?? 1;
  const left = Math.max(0, Math.floor(spec.leftX));
  const right = Math.min(canvas.size - 1, Math.ceil(spec.rightX));
  const halfWidth = Math.max(1e-6, (spec.rightX - spec.leftX) / 2);
  const centerX = (spec.leftX + spec.rightX) / 2;
  for (let x = left; x <= right; x++) {
    const edges = spec.edgesAt(x);
    if (!edges || edges.bottom <= edges.top) continue;
    const across = (x - centerX) / halfWidth;
    const height = edges.bottom - edges.top;
    for (let y = Math.floor(edges.top); y <= Math.ceil(edges.bottom); y++) {
      const coverage = clampUnitCoverage(Math.min(y + 0.5 - edges.top, edges.bottom - y + 0.5));
      if (coverage <= 0) continue;
      const along = ((y - edges.top) / height) * 2 - 1;
      blendPixel(canvas, x, y, shade(across, along), coverage * opacity);
    }
  }
}

function forEachPixelInBox(
  canvas: SpriteCanvas,
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
  visit: (x: number, y: number) => void,
): void {
  const left = Math.max(0, Math.floor(centerX - halfWidth - 1));
  const right = Math.min(canvas.size - 1, Math.ceil(centerX + halfWidth + 1));
  const top = Math.max(0, Math.floor(centerY - halfHeight - 1));
  const bottom = Math.min(canvas.size - 1, Math.ceil(centerY + halfHeight + 1));
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) visit(x, y);
}

function sideOfSegment(offsetX: number, offsetY: number, spanX: number, spanY: number): number {
  return offsetX * spanY - offsetY * spanX >= 0 ? 1 : -1;
}

function clampUnitCoverage(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

function clampUnitRange(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}
