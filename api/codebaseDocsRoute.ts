import { renderCodebasePage } from './docs/renderCodebasePage';
import type { Router } from './router';

export const CODEBASE_DOCS_PATH = '/docs';

export function mountCodebaseDocs(router: Router): void {
  router.get(CODEBASE_DOCS_PATH, (_req, res) => {
    const page = renderCodebasePage();
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-length': Buffer.byteLength(page),
    });
    res.end(page);
  });
}
