import type { IncomingMessage, ServerResponse } from 'node:http';

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) => void | Promise<void>;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  private mounts: Array<{ prefix: string; handler: RouteHandler }> = [];

  on(method: string, path: string, handler: RouteHandler): void {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  get(path: string, handler: RouteHandler): void {
    this.on('GET', path, handler);
  }

  mount(prefix: string, handler: RouteHandler): void {
    this.mounts.push({ prefix, handler });
  }

  handle(req: IncomingMessage, res: ServerResponse): boolean {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = (req.method ?? 'GET').toUpperCase();
    for (const route of this.routes) {
      if (route.method === method && route.path === url.pathname) {
        void route.handler(req, res, url);
        return true;
      }
    }
    for (const mounted of this.mounts) {
      if (url.pathname === mounted.prefix || url.pathname.startsWith(mounted.prefix + '/')) {
        void mounted.handler(req, res, url);
        return true;
      }
    }
    return false;
  }
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(data),
  });
  res.end(data);
}
