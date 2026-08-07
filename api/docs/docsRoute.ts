import { registerRoute } from '../agent/routeRegistry';
import { buildApiDocs } from './apiDocs';

registerRoute({
  method: 'GET',
  path: '/docs',
  summary: 'this document',
  body: '—',
  handle: ({ access }) => ({
    status: 200,
    contentType: 'text/markdown',
    body: buildApiDocs(access.current().tileset),
  }),
});
