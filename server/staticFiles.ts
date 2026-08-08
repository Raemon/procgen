import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';
import { acceptsGzip } from './acceptsGzip';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const GZIPPED_EXTENSIONS = ['.html', '.js', '.mjs', '.css', '.json', '.svg', '.map'];

export function serveStatic(dist: string, req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const filePath = normalize(join(dist, pathname === '/' ? '/index.html' : pathname));
  if (!filePath.startsWith(dist)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(filePath) && statSync(filePath).isFile()) return streamFile(filePath, req, res);
  serveSpaFallback(dist, req, res);
}

function serveSpaFallback(dist: string, req: IncomingMessage, res: ServerResponse): void {
  const index = join(dist, 'index.html');
  if (existsSync(index)) return streamFile(index, req, res);
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('procgen server running. Client build not found (npm run build).');
}

function streamFile(filePath: string, req: IncomingMessage, res: ServerResponse): void {
  const extension = extname(filePath).toLowerCase();
  const gzip = GZIPPED_EXTENSIONS.includes(extension) && acceptsGzip(req);
  res.writeHead(200, {
    'content-type': MIME[extension] ?? 'application/octet-stream',
    vary: 'accept-encoding',
    ...(gzip ? { 'content-encoding': 'gzip' } : {}),
  });
  const file = createReadStream(filePath).on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
  if (gzip) file.pipe(createGzip()).pipe(res);
  else file.pipe(res);
}
