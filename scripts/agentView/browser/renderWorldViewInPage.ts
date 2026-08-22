import '@/features/asset-library/worlds/nodes';
import type { FramedCamera } from '@/features/game/render/view3d/framedCamera';
import type { WorldViewRequest } from '../worldViewRequest';
import { characterCameraForRequest } from './characterCameraForRequest';
import { godCameraForRequest } from './godCameraForRequest';
import { headlessWorldForRequest } from './headlessWorldForName';
import { HeadlessWorldView } from './headlessWorldView';
import { renderUntilWorldIsMeshed } from './renderUntilWorldIsMeshed';
import type { HeadlessWorld } from '../../headlessWorld';

export interface RenderedWorldView {
  pngDataUrl: string;
  frames: number;
  chunks: number;
  drawCalls: number;
  triangles: number;
  meanLuminance: number;
  luminanceSpread: number;
}

declare global {
  interface Window {
    renderWorldView(request: WorldViewRequest): Promise<RenderedWorldView>;
  }
}

window.renderWorldView = async (request) => {
  const world = headlessWorldForRequest(request);
  const view = new HeadlessWorldView(world, request, cameraForRequest(request, world));
  const frames = await renderUntilWorldIsMeshed(view);
  const pngDataUrl = view.pngDataUrl();
  const exposure = await exposureOf(pngDataUrl);
  return {
    pngDataUrl,
    frames,
    chunks: view.builtChunkCount(),
    ...view.gpuLoad(),
    ...exposure,
  };
};

async function exposureOf(
  pngDataUrl: string,
): Promise<{ meanLuminance: number; luminanceSpread: number }> {
  const image = await loadedImage(pngDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  return luminanceStats(pixels);
}

function luminanceStats(pixels: Uint8ClampedArray): {
  meanLuminance: number;
  luminanceSpread: number;
} {
  let total = 0;
  let squared = 0;
  let sampled = 0;
  for (let at = 0; at < pixels.length; at += 16) {
    const luminance = 0.299 * pixels[at]! + 0.587 * pixels[at + 1]! + 0.114 * pixels[at + 2]!;
    total += luminance;
    squared += luminance * luminance;
    sampled++;
  }
  if (sampled === 0) return { meanLuminance: 0, luminanceSpread: 0 };
  const mean = total / sampled;
  return {
    meanLuminance: mean,
    luminanceSpread: Math.sqrt(Math.max(0, squared / sampled - mean * mean)),
  };
}

function loadedImage(pngDataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = pngDataUrl;
  });
}

function cameraForRequest(request: WorldViewRequest, world: HeadlessWorld): FramedCamera {
  if (request.style === 'character') return characterCameraForRequest(request, world.sampler);
  return godCameraForRequest(request);
}
