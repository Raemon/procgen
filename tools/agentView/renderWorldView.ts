import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { RenderedWorldView } from './browser/renderWorldViewInPage';
import { browserViewBundle } from './browserViewBundle';
import { captureWorldViewPng } from './captureWorldViewPng';
import { worldViewCommandFromArgv, type WorldViewCommand } from './worldViewRequestFromFlags';

const command = worldViewCommandFromArgv(process.argv.slice(2));
await renderToDisk(command);

async function renderToDisk({ request, outputPath }: WorldViewCommand): Promise<void> {
  const rendered = await captureWorldViewPng(request, await browserViewBundle());
  writePng(outputPath, rendered.pngDataUrl);
  console.log(describeRender(outputPath, rendered, request.width, request.height));
}

function writePng(outputPath: string, pngDataUrl: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(pngDataUrl.split(',')[1]!, 'base64'));
}

function describeRender(
  outputPath: string,
  rendered: RenderedWorldView,
  width: number,
  height: number,
): string {
  return [
    `${outputPath} ${width}x${height}`,
    `${rendered.chunks} chunks meshed in ${rendered.frames} frames`,
    `${rendered.drawCalls} draw calls, ${rendered.triangles} triangles`,
  ].join(' | ');
}
