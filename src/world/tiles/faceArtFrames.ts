import {
  blankFacePixels,
  CUBE_FACES,
  DEFAULT_FRAME_MS,
  MAX_ART_FRAMES,
  MAX_FRAME_MS,
  MIN_FRAME_MS,
  type CubeFace,
  type CubeFaceArt,
  type FaceArtFrame,
  type FaceGrids,
  type FacePixels,
  type PartialFaceGrids,
} from './tileFaceArt';

export type ArtLayer = 'color' | 'height';

export interface ArtSlot {
  face: CubeFace;
  frame: number;
  layer: ArtLayer;
}

export function frameCount(art: CubeFaceArt): number {
  return 1 + (art.framesAfterFirst?.length ?? 0);
}

export function isAnimated(art: CubeFaceArt): boolean {
  return frameCount(art) > 1;
}

export function frameMsOf(art: CubeFaceArt): number {
  return clampFrameMs(art.frameMs ?? DEFAULT_FRAME_MS);
}

export function clampFrameMs(frameMs: number): number {
  return Math.min(MAX_FRAME_MS, Math.max(MIN_FRAME_MS, Math.round(frameMs)));
}

export function faceArtFrames(art: CubeFaceArt): FaceArtFrame[] {
  return [firstFrameOf(art), ...(art.framesAfterFirst ?? [])];
}

function firstFrameOf(art: CubeFaceArt): FaceArtFrame {
  const color = {} as FaceGrids;
  for (const face of CUBE_FACES) color[face] = art[face];
  return { color, height: art.height ?? null };
}

export function faceArtWithFrames(art: CubeFaceArt, frames: FaceArtFrame[]): CubeFaceArt {
  const [first, ...rest] = frames;
  if (!first) return art;
  return {
    ...art,
    ...(first.color as FaceGrids),
    height: first.height,
    framesAfterFirst: rest.length > 0 ? rest : undefined,
  };
}

export function facePixelsAt(art: CubeFaceArt, slot: ArtSlot): FacePixels {
  const frames = faceArtFrames(art);
  const frame = frames[Math.min(Math.max(slot.frame, 0), frames.length - 1)]!;
  return (
    gridsOfLayer(frame, slot.layer)?.[slot.face] ??
    gridsOfLayer(frames[0]!, slot.layer)?.[slot.face] ??
    blankFacePixels(art.size)
  );
}

function gridsOfLayer(frame: FaceArtFrame, layer: ArtLayer): PartialFaceGrids | null {
  return layer === 'color' ? frame.color : frame.height;
}

export function faceArtWithPixelsAt(
  art: CubeFaceArt,
  slot: ArtSlot,
  pixels: FacePixels,
): CubeFaceArt {
  const frames = faceArtFrames(art);
  const frame = frames[slot.frame];
  if (!frame) return art;
  frames[slot.frame] = frameWithPixels(frame, slot, pixels);
  return faceArtWithFrames(art, frames);
}

function frameWithPixels(
  frame: FaceArtFrame,
  slot: ArtSlot,
  pixels: FacePixels,
): FaceArtFrame {
  if (slot.layer === 'color') {
    return { ...frame, color: { ...frame.color, [slot.face]: pixels } };
  }
  return { ...frame, height: { ...(frame.height ?? {}), [slot.face]: pixels } };
}

export function faceArtWithFrameInserted(art: CubeFaceArt, afterFrame: number): CubeFaceArt {
  if (frameCount(art) >= MAX_ART_FRAMES) return art;
  const frames = faceArtFrames(art);
  frames.splice(afterFrame + 1, 0, copiedFrame(frames[afterFrame] ?? frames[0]!));
  return faceArtWithFrames(art, frames);
}

export function faceArtWithFrameRemoved(art: CubeFaceArt, frame: number): CubeFaceArt {
  if (frameCount(art) <= 1) return art;
  const frames = faceArtFrames(art);
  const [dropped] = frames.splice(frame, 1);
  return faceArtWithFrames(art, frame === 0 ? framesRebasedOn(dropped!, frames) : frames);
}

/** Dropping the first frame promotes the next one, which may lean on faces it left out. */
function framesRebasedOn(dropped: FaceArtFrame, frames: FaceArtFrame[]): FaceArtFrame[] {
  const [next, ...rest] = frames;
  if (!next) return frames;
  return [{ color: { ...dropped.color, ...next.color }, height: mergedHeight(dropped, next) }, ...rest];
}

function mergedHeight(dropped: FaceArtFrame, next: FaceArtFrame): PartialFaceGrids | null {
  if (!dropped.height && !next.height) return null;
  return { ...dropped.height, ...next.height };
}

function copiedFrame(frame: FaceArtFrame): FaceArtFrame {
  return { color: { ...frame.color }, height: frame.height ? { ...frame.height } : null };
}

export function mapEveryFaceGrid(
  art: CubeFaceArt,
  transform: (pixels: FacePixels) => FacePixels,
): CubeFaceArt {
  const frames = faceArtFrames(art).map((frame) => ({
    color: mappedGrids(frame.color, transform),
    height: frame.height ? mappedGrids(frame.height, transform) : null,
  }));
  return faceArtWithFrames(art, frames);
}

function mappedGrids(
  grids: PartialFaceGrids,
  transform: (pixels: FacePixels) => FacePixels,
): PartialFaceGrids {
  const mapped: PartialFaceGrids = {};
  for (const face of CUBE_FACES) if (grids[face]) mapped[face] = transform(grids[face]!);
  return mapped;
}
