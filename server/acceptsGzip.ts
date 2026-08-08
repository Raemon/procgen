import type { IncomingMessage } from 'node:http';

export function acceptsGzip(req: IncomingMessage): boolean {
  const accepted = req.headers['accept-encoding'];
  const header = Array.isArray(accepted) ? accepted.join(',') : (accepted ?? '');
  return header.split(',').some((encoding) => encoding.trim().split(';')[0] === 'gzip');
}
