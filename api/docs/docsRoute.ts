import { registerRoute } from '../agent/routeRegistry';
import { buildApiDocs } from './apiDocs';
import { openApiDocument } from './openApiDocument';
import { json } from '../agent/apiMessages';

registerRoute({
  method: 'GET',
  path: '/docs',
  summary: 'this document',
  body: {},
  query: {},
  handle: ({ access }) => ({
    status: 200,
    contentType: 'text/markdown',
    body: buildApiDocs(access.current().tileset),
  }),
});

registerRoute({
  method: 'GET',
  path: '/openapi.json',
  summary: 'this API as an OpenAPI 3.1 document, including every action as a JSON Schema variant',
  body: {},
  query: {},
  handle: () => json(200, openApiDocument()),
});
