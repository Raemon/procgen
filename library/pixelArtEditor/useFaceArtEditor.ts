import { useRef, useState } from 'react';
import {
  clampFrameMs,
  faceArtWithFrameInserted,
  faceArtWithFrameRemoved,
  faceArtWithPixelsAt,
  facePixelsAt,
  frameCount,
  frameMsOf,
  type ArtLayer,
  type ArtSlot,
} from '../tiles/faceArtFrames';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  DEFAULT_FRAME_MS,
  faceGridSize,
  type CubeFaceArt,
  type FacePixels,
} from '../tiles/tileFaceArt';
import { floodFillFacePixels } from './ops/floodFillFacePixels';
import { copyFaceToAllSides, sideFacesMatch } from './ops/linkedSideFaces';
import { mirroredPixelIndices } from './ops/mirroredPixelIndices';
import { resampleFacePixels, resizeCubeFaceArt } from './ops/resizeFaceArt';
import { shiftFacePixelsWithWrap } from './ops/shiftFacePixelsWithWrap';
import { isTransparentInk, TRANSPARENT_INK } from '../tiles/inkColor';
import type { CubeFace } from '../tiles/tileFaceArt';
import {
  activeFace,
  initialPaintSettings,
  isSideTab,
  paintedLayerInk,
  targetFaces,
  type FaceTab,
  type PaintSettings,
  type PaintTool,
} from './paintSettings';
import type { StrokePhase } from './PixelPaintCanvas';
import { useFaceArtHistory } from './useFaceArtHistory';

export interface FaceArtSource {
  art: CubeFaceArt | null;
  baseColor: string;
  lockedFace?: CubeFace;
  onChange(art: CubeFaceArt | null): void;
}

export interface FaceArtEditor {
  settings: PaintSettings;
  size: number;
  art: CubeFaceArt | null;
  frameCount: number;
  frameMs: number;
  activePixels: FacePixels;
  updateSettings(patch: Partial<PaintSettings>): void;
  selectFace(tab: FaceTab): void;
  selectLayer(layer: ArtLayer): void;
  selectFrame(frame: number): void;
  toggleLinkedSides(): void;
  setTool(tool: PaintTool): void;
  paintAt(index: number, phase: StrokePhase): void;
  endStroke(): void;
  undo(): void;
  copyFace(): void;
  pasteFace(): void;
  clearFace(): void;
  shiftFace(dx: number, dy: number): void;
  changeResolution(size: number): void;
  addFrame(): void;
  removeFrame(): void;
  changeFrameMs(frameMs: number): void;
}

function paintedInk(settings: PaintSettings): string | null {
  const ink = paintedLayerInk(settings);
  if (settings.tool === 'erase' || isTransparentInk(ink)) return null;
  return ink;
}

export function useFaceArtEditor({
  art,
  baseColor,
  lockedFace,
  onChange,
}: FaceArtSource): FaceArtEditor {
  const [settings, setSettings] = useState(() =>
    initialPaintSettings(art, baseColor, lockedFace),
  );
  const [strokeArt, setStrokeArt] = useState<CubeFaceArt | null>(null);
  const clipboard = useRef<FacePixels | null>(null);
  const history = useFaceArtHistory(art, onChange);
  const size = strokeArt?.size ?? art?.size ?? settings.size;
  const paintedArt = strokeArt ?? art;
  const frames = paintedArt ? frameCount(paintedArt) : 1;
  const frame = Math.min(settings.frame, frames - 1);

  const updateSettings = (patch: Partial<PaintSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  function slotFor(face: CubeFace): ArtSlot {
    return { face, frame, layer: settings.layer };
  }

  function editableArt(): CubeFaceArt {
    return art ? cloneCubeFaceArt(art) : blankCubeFaceArt(size);
  }

  function pixelsOf(source: CubeFaceArt | null, face: CubeFace): FacePixels {
    return source ? facePixelsAt(source, slotFor(face)) : blankFacePixels(size);
  }

  function commitToTargetFaces(transform: (pixels: FacePixels) => FacePixels): void {
    history.commit(paintedOverTargetFaces(editableArt(), transform));
  }

  function paintedOverTargetFaces(
    next: CubeFaceArt,
    transform: (pixels: FacePixels) => FacePixels,
  ): CubeFaceArt {
    return targetFaces(settings).reduce(
      (painted, face) =>
        faceArtWithPixelsAt(painted, slotFor(face), transform(pixelsOf(painted, face))),
      next,
    );
  }

  function toggleLinkedSides(): void {
    if (settings.linkedSides) return unlinkSides();
    relinkSidesTo(isSideTab(settings.faceTab) ? activeFace(settings) : 'north');
  }

  function unlinkSides(): void {
    updateSettings({
      linkedSides: false,
      faceTab: settings.faceTab === 'sides' ? 'north' : settings.faceTab,
    });
  }

  function relinkSidesTo(sourceFace: ReturnType<typeof activeFace>): void {
    updateSettings({ linkedSides: true, faceTab: 'sides' });
    if (art && !sideFacesMatch(art)) history.commit(copyFaceToAllSides(art, sourceFace));
  }

  function paintAt(index: number, phase: StrokePhase): void {
    if (settings.tool === 'pick') return void (phase === 'start' && pickColorAt(index));
    if (settings.tool === 'fill')
      return void (phase === 'start' &&
        commitToTargetFaces((pixels) =>
          floodFillFacePixels(pixels, size, index, paintedInk(settings)),
        ));
    strokePaintAt(index);
  }

  function pickColorAt(index: number): void {
    const picked = pixelsOf(art, activeFace(settings))[index] ?? null;
    const inkPatch =
      settings.layer === 'height'
        ? { heightInk: picked ?? TRANSPARENT_INK }
        : { paintColor: picked ?? TRANSPARENT_INK };
    updateSettings({ ...inkPatch, tool: 'draw' });
  }

  function strokePaintAt(index: number): void {
    const value = paintedInk(settings);
    const mirrored = mirroredPixelIndices(index, size, settings.mirrorX, settings.mirrorY);
    setStrokeArt(
      paintedOverTargetFaces(strokeArt ? cloneCubeFaceArt(strokeArt) : editableArt(), (pixels) =>
        pixelsWithInkAt(pixels, mirrored, value),
      ),
    );
  }

  function endStroke(): void {
    if (!strokeArt) return;
    setStrokeArt(null);
    history.commit(strokeArt);
  }

  function pasteFace(): void {
    const copied = clipboard.current;
    if (!copied) return;
    const pixels = resampleFacePixels(copied, faceGridSize(copied), size);
    commitToTargetFaces(() => [...pixels]);
  }

  function changeResolution(nextSize: number): void {
    if (art) history.commit(resizeCubeFaceArt(art, nextSize));
    updateSettings({ size: nextSize });
  }

  function addFrame(): void {
    history.commit(faceArtWithFrameInserted(editableArt(), frame));
    updateSettings({ frame: frame + 1 });
  }

  function removeFrame(): void {
    if (!art || frames <= 1) return;
    history.commit(faceArtWithFrameRemoved(art, frame));
    updateSettings({ frame: Math.max(0, frame - 1) });
  }

  return {
    settings: { ...settings, frame },
    size,
    art: paintedArt,
    frameCount: frames,
    frameMs: paintedArt ? frameMsOf(paintedArt) : DEFAULT_FRAME_MS,
    activePixels: pixelsOf(paintedArt, activeFace(settings)),
    updateSettings,
    selectFace: (faceTab) => updateSettings({ faceTab }),
    selectLayer: (layer) => updateSettings({ layer }),
    selectFrame: (nextFrame) => updateSettings({ frame: nextFrame, playing: false }),
    toggleLinkedSides,
    setTool: (tool) => updateSettings({ tool }),
    paintAt,
    endStroke,
    undo: history.undo,
    copyFace: () => (clipboard.current = [...pixelsOf(paintedArt, activeFace(settings))]),
    pasteFace,
    clearFace: () => commitToTargetFaces(() => blankFacePixels(size)),
    shiftFace: (dx, dy) => {
      if (art) commitToTargetFaces((pixels) => shiftFacePixelsWithWrap(pixels, size, dx, dy));
    },
    changeResolution,
    addFrame,
    removeFrame,
    changeFrameMs: (frameMs) => {
      if (art) history.commit({ ...cloneCubeFaceArt(art), frameMs: clampFrameMs(frameMs) });
    },
  };
}

function pixelsWithInkAt(
  pixels: FacePixels,
  indices: readonly number[],
  ink: string | null,
): FacePixels {
  const painted = [...pixels];
  for (const index of indices) painted[index] = ink;
  return painted;
}
