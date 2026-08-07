import { renderCodebasePage } from './docs/renderCodebasePage';
import type { Router } from './router';

export function mountCodebaseDocs(router: Router): void {
  router.get('/docs', (_req, res) => {
    const page = renderCodebasePage();
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-length': Buffer.byteLength(page),
    });
    res.end(page);
  });
}
