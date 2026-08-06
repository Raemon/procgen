import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterDocChanged, type DocSyncDeps } from '../game/docSync';
import { isPersistedDocName, readDocFile, writeDocFile } from '../persist/docsRepo';
import type { Router } from './router';

export function mountPersistRoutes(router: Router, deps: DocSyncDeps): void {
  router.mount('/persist', (req, res, url) => {
    const name = url.pathname.replace(/^\/persist\//, '');
    if (!isPersistedDocName(name)) return endWithStatus(res, 404);
    if (req.method === 'GET') return sendDoc(deps.root, name, res);
    if (req.method === 'PUT') return receiveDoc(deps, name, req, res);
    endWithStatus(res, 405);
  });
}

function sendDoc(root: string, name: string, res: ServerResponse): void {
  const raw = readDocFile(root, name);
  if (raw === null) return endWithStatus(res, 404);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(raw);
}

function receiveDoc(deps: DocSyncDeps, name: string, req: IncomingMessage, res: ServerResponse): void {
  collectBody(req, (body) => {
    const json = parseJson(body);
    if (json === undefined) return endWithStatus(res, 400);
    writeDocFile(deps.root, name, json);
    afterDocChanged(deps, name, json);
    endWithStatus(res, 204);
  });
}

function collectBody(req: IncomingMessage, done: (body: string) => void): void {
  let body = '';
  req.on('data', (piece: Buffer) => (body += piece.toString()));
  req.on('end', () => done(body));
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function endWithStatus(res: ServerResponse, status: number): void {
  res.statusCode = status;
  res.end();
}
