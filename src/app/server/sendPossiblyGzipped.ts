import type { IncomingMessage, ServerResponse } from 'node:http';
import { gzipSync } from 'node:zlib';
import { acceptsGzip } from './acceptsGzip';

const SMALLEST_BODY_WORTH_COMPRESSING = 1024;

export function sendPossiblyGzipped(
  req: IncomingMessage,
  res: ServerResponse,
  contentType: string,
  text: string,
): void {
  const body = Buffer.from(text);
  if (!worthGzipping(req, body)) return sendBody(res, contentType, body, null);
  sendBody(res, contentType, gzipSync(body), 'gzip');
}

function worthGzipping(req: IncomingMessage, body: Buffer): boolean {
  return body.length >= SMALLEST_BODY_WORTH_COMPRESSING && acceptsGzip(req);
}

function sendBody(
  res: ServerResponse,
  contentType: string,
  body: Buffer,
  encoding: string | null,
): void {
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': body.length,
    vary: 'accept-encoding',
    ...(encoding ? { 'content-encoding': encoding } : {}),
  });
  res.end(body);
}
