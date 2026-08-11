import { existsSync, readFileSync } from 'node:fs';
import { join, normalize } from 'node:path';

export const PAGE_ORIGIN = 'http://agent-view.local';

const PUBLIC_DIRECTORY = 'public';
const BUNDLE_PATH = '/renderWorldViewInPage.js';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.json': 'application/json',
  '.js': 'text/javascript',
};

export interface ServedResponse {
  status: number;
  contentType: string;
  body: string | Buffer;
}

export function servedResponseFor(url: string, bundle: string): ServedResponse {
  const path = new URL(url).pathname;
  if (path === '/') return { status: 200, contentType: 'text/html', body: pageHtml() };
  if (path === BUNDLE_PATH) return { status: 200, contentType: 'text/javascript', body: bundle };
  return publicFileResponse(path);
}

function publicFileResponse(path: string): ServedResponse {
  const filePath = join(PUBLIC_DIRECTORY, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!existsSync(filePath)) return { status: 404, contentType: 'text/plain', body: 'not found' };
  return { status: 200, contentType: contentTypeOf(filePath), body: readFileSync(filePath) };
}

function contentTypeOf(filePath: string): string {
  const extension = filePath.slice(filePath.lastIndexOf('.'));
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

function pageHtml(): string {
  return `<!doctype html><html><body style="margin:0"><script src="${BUNDLE_PATH}"></script></body></html>`;
}
