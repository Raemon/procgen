import '../../../procgen/nodes';
import type { WorldViewRequest } from '../worldViewRequest';
import { characterCameraForRequest } from './characterCameraForRequest';
import type { FramedCamera } from './framedCamera';
import { godCameraForRequest } from './godCameraForRequest';
import { headlessWorldForName } from './headlessWorldForName';
import { HeadlessWorldView } from './headlessWorldView';
import { renderUntilWorldIsMeshed } from './renderUntilWorldIsMeshed';
import type { HeadlessWorld } from '../../headlessWorld';

export interface RenderedWorldView {
  pngDataUrl: string;
  frames: number;
  chunks: number;
  drawCalls: number;
  triangles: number;
}

declare global {
  interface Window {
    renderWorldView(request: WorldViewRequest): Promise<RenderedWorldView>;
  }
}

window.renderWorldView = async (request) => {
  const world = headlessWorldForName(request.worldName);
  const view = new HeadlessWorldView(world, request, cameraForRequest(request, world));
  const frames = await renderUntilWorldIsMeshed(view);
  return { pngDataUrl: view.pngDataUrl(), frames, chunks: view.builtChunkCount(), ...view.gpuLoad() };
};

function cameraForRequest(request: WorldViewRequest, world: HeadlessWorld): FramedCamera {
  if (request.style === 'character') return characterCameraForRequest(request, world.sampler);
  return godCameraForRequest(request);
}
