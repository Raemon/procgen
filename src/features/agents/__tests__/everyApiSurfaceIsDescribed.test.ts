import { openApiDocument } from '@/features/app-shell/api/openApiDocument';
import { buildApiEndpointCatalog } from '@/features/app-shell/documentation/apiEndpointCatalog';
import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';

interface DocumentShape {
  paths: Record<string, Record<string, unknown>>;
  'x-agent-tools': Record<string, { name: string; path: string }[]>;
}

export function checkEveryApiSurfaceIsDescribed(
  check: (name: string, condition: boolean) => void,
): void {
  const document = openApiDocument() as DocumentShape;
  const endpoints = buildApiEndpointCatalog().filter((endpoint) => endpoint.path.startsWith('/api/v1'));
  check(
    'every discovered API endpoint reaches the OpenAPI document',
    endpoints.every((endpoint) => {
      const path = endpoint.path.slice('/api/v1'.length) || '/';
      const method = endpoint.transport === 'websocket' ? 'get' : endpoint.method.toLowerCase();
      return document.paths[path]?.[method];
    }),
  );

  const tools = Object.values(document['x-agent-tools']).flat();
  const described = new Set(tools.map((tool) => tool.name));
  check('every feature-owned command generates an agent tool contract', allCommands().every((command) => described.has(command.action)));
  check('every generated agent tool names its canonical transport path', tools.every((tool) => document.paths[tool.path] !== undefined));
}
