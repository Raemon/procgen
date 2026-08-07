import type { ChunkGenCtx } from '../nodeType';
import { asField } from './valueAccess';

export interface FieldWindow {
  originX: number;
  originY: number;
  width: number;
  height: number;
  data: Float32Array;
}

export const MAX_WINDOW_RADIUS = 128;

export function clampedWindowRadius(radius: number): number {
  return Math.min(MAX_WINDOW_RADIUS, Math.max(0, Math.round(radius)));
}

export function gatherFieldWindow(
  ctx: ChunkGenCtx,
  inputName: string,
  radius: number,
): FieldWindow | null {
  const clamped = clampedWindowRadius(radius);
  return gatherFieldWindowRect(
    ctx,
    inputName,
    ctx.originX - clamped,
    ctx.originY - clamped,
    ctx.size + clamped * 2,
    ctx.size + clamped * 2,
  );
}

export function gatherFieldWindowRect(
  ctx: ChunkGenCtx,
  inputName: string,
  originX: number,
  originY: number,
  width: number,
  height: number,
): FieldWindow | null {
  if (!ctx.fieldInput(inputName)) return null;
  const window: FieldWindow = {
    originX,
    originY,
    width,
    height,
    data: new Float32Array(width * height),
  };
  for (const [chunkX, chunkY] of chunksCovering(window, ctx.size)) {
    copyChunkIntoWindow(ctx, inputName, window, chunkX, chunkY);
  }
  return window;
}

export function windowIndexAt(window: FieldWindow, worldX: number, worldY: number): number {
  const localX = worldX - window.originX;
  const localY = worldY - window.originY;
  if (localX < 0 || localY < 0 || localX >= window.width || localY >= window.height) return -1;
  return localY * window.width + localX;
}

export function windowValueAt(window: FieldWindow, worldX: number, worldY: number): number {
  const index = windowIndexAt(window, worldX, worldY);
  return index < 0 ? 0 : window.data[index]!;
}

export function windowWorldX(window: FieldWindow, index: number): number {
  return window.originX + (index % window.width);
}

export function windowWorldY(window: FieldWindow, index: number): number {
  return window.originY + Math.floor(index / window.width);
}

function chunksCovering(window: FieldWindow, size: number): [number, number][] {
  const chunks: [number, number][] = [];
  const lastX = Math.floor((window.originX + window.width - 1) / size);
  const lastY = Math.floor((window.originY + window.height - 1) / size);
  for (let chunkY = Math.floor(window.originY / size); chunkY <= lastY; chunkY++) {
    for (let chunkX = Math.floor(window.originX / size); chunkX <= lastX; chunkX++) chunks.push([chunkX, chunkY]);
  }
  return chunks;
}

function copyChunkIntoWindow(
  ctx: ChunkGenCtx,
  inputName: string,
  window: FieldWindow,
  chunkX: number,
  chunkY: number,
): void {
  const field = asField(ctx.inputAt(inputName, chunkX, chunkY));
  if (!field) return;
  const originX = chunkX * ctx.size;
  const originY = chunkY * ctx.size;
  for (let y = rowStart(window, originY); y < rowEnd(window, originY, ctx.size); y++) {
    copyRow(field, window, originX, originY, y, ctx.size);
  }
}

function rowStart(window: FieldWindow, chunkOriginY: number): number {
  return Math.max(window.originY, chunkOriginY);
}

function rowEnd(window: FieldWindow, chunkOriginY: number, size: number): number {
  return Math.min(window.originY + window.height, chunkOriginY + size);
}

function copyRow(
  field: Float32Array,
  window: FieldWindow,
  chunkOriginX: number,
  chunkOriginY: number,
  worldY: number,
  size: number,
): void {
  const from = Math.max(window.originX, chunkOriginX);
  const to = Math.min(window.originX + window.width, chunkOriginX + size);
  for (let worldX = from; worldX < to; worldX++) {
    window.data[windowIndexAt(window, worldX, worldY)] =
      field[(worldY - chunkOriginY) * size + (worldX - chunkOriginX)]!;
  }
}
