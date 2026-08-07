import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterDocChanged, type DocSyncDeps } from '../game/docSync';
import { isPersistedDocName, type DocStore } from '../persist/docsRepo';
import type { Router } from './router';

export function mountPersistRoutes(router: Router, docs: DocStore, deps: DocSyncDeps): void {
  router.mount('/persist', (req, res, url) => {
    const name = url.pathname.replace(/^\/persist\//, '');
    if (!isPersistedDocName(name)) return endWithStatus(res, 404);
    if (req.method === 'GET') return sendDoc(docs, name, res);
    if (req.method === 'PUT') return receiveDoc(docs, deps, name, req, res);
    endWithStatus(res, 405);
  });
}

function sendDoc(docs: DocStore, name: string, res: ServerResponse): void {
  const json = docs.read(name);
  if (json === null) return endWithStatus(res, 404);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(json));
}

function receiveDoc(
  docs: DocStore,
  deps: DocSyncDeps,
  name: string,
  req: IncomingMessage,
  res: ServerResponse,
): void {
  collectBody(req, (body) => {
    const json = parseJson(body);
    if (json === undefined) return endWithStatus(res, 400);
    docs.write(name, json);
    afterDocChanged(deps, name);
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
