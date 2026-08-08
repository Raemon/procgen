import type { HeadlessWorldView } from './headlessWorldView';
import { textureLoadingIdle } from './textureLoadingIdle';

const MAX_FRAMES = 3000;
const PAINTED_FRAMES_AFTER_STREAMING = 3;
const FRAME_GAP_MS = 4;

export async function renderUntilWorldIsMeshed(view: HeadlessWorldView): Promise<number> {
  const texturesIdle = textureLoadingIdle();
  for (let frames = 1; frames <= MAX_FRAMES; frames++) {
    view.streamFrame();
    if (view.builtChunkCount() >= view.neededChunkCount() && texturesIdle()) {
      return frames + (await paintSettledFrames(view));
    }
    await nextFrameGap();
  }
  throw new Error(unfinishedSceneMessage(view));
}

async function paintSettledFrames(view: HeadlessWorldView): Promise<number> {
  for (let frame = 0; frame < PAINTED_FRAMES_AFTER_STREAMING; frame++) {
    await nextFrameGap();
    view.paintFrame();
  }
  return PAINTED_FRAMES_AFTER_STREAMING;
}

function nextFrameGap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FRAME_GAP_MS));
}

function unfinishedSceneMessage(view: HeadlessWorldView): string {
  return `only ${view.builtChunkCount()} of ${view.neededChunkCount()} chunks meshed after ${MAX_FRAMES} frames`;
}
