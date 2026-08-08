import type { HeadlessWorldView } from './headlessWorldView';
import { textureLoadingIdle } from './textureLoadingIdle';

const MAX_FRAMES = 3000;
const SETTLING_FRAMES = 3;
const FRAME_GAP_MS = 4;

export async function renderUntilWorldIsMeshed(view: HeadlessWorldView): Promise<number> {
  const texturesIdle = textureLoadingIdle();
  for (let frames = 1; frames <= MAX_FRAMES; frames++) {
    view.renderFrame();
    if (view.builtChunkCount() >= view.neededChunkCount() && texturesIdle()) {
      return frames + (await renderSettlingFrames(view));
    }
    await nextFrameGap();
  }
  throw new Error(unfinishedSceneMessage(view));
}

async function renderSettlingFrames(view: HeadlessWorldView): Promise<number> {
  for (let frame = 0; frame < SETTLING_FRAMES; frame++) {
    await nextFrameGap();
    view.renderFrame();
  }
  return SETTLING_FRAMES;
}

function nextFrameGap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FRAME_GAP_MS));
}

function unfinishedSceneMessage(view: HeadlessWorldView): string {
  return `only ${view.builtChunkCount()} of ${view.neededChunkCount()} chunks meshed after ${MAX_FRAMES} frames`;
}
