import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Connect, type ViteDevServer } from 'vite';

const DATA_DIR = 'data';
const PERSISTED_FILES = ['pipeline', 'tileset'];

export default defineConfig({
  plugins: [persistToRepoFiles()],
});

function persistToRepoFiles() {
  return {
    name: 'persist-to-repo-files',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(persistMiddleware(server.config.root));
    },
  };
}

function persistMiddleware(root: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const name = persistedNameOf(req.url);
    if (!name) return next();
    if (req.method === 'GET') return sendPersistedFile(root, name, res);
    if (req.method === 'PUT') return receivePersistedFile(root, name, req, res);
    next();
  };
}

function persistedNameOf(url: string | undefined): string | null {
  const match = url?.match(/^\/persist\/([a-z]+)$/);
  const name = match?.[1];
  return name && PERSISTED_FILES.includes(name) ? name : null;
}

function persistedFilePath(root: string, name: string): string {
  return join(root, DATA_DIR, `${name}.json`);
}

function sendPersistedFile(root: string, name: string, res: import('node:http').ServerResponse): void {
  const path = persistedFilePath(root, name);
  if (!existsSync(path)) {
    res.statusCode = 404;
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(readFileSync(path, 'utf8'));
}

function receivePersistedFile(
  root: string,
  name: string,
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
): void {
  let body = '';
  req.on('data', (piece) => (body += piece));
  req.on('end', () => {
    try {
      mkdirSync(join(root, DATA_DIR), { recursive: true });
      writeFileSync(persistedFilePath(root, name), prettyJson(body));
      res.statusCode = 204;
    } catch {
      res.statusCode = 500;
    }
    res.end();
  });
}

function prettyJson(body: string): string {
  return JSON.stringify(JSON.parse(body), null, 2) + '\n';
}
