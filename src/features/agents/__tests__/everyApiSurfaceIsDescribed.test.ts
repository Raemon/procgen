import { API_CONTRACTS } from '@/features/app-shell/api/apiContracts';
import { openApiDocument } from '@/features/app-shell/api/openApiDocument';
import { allCommands } from '@/features/app-shell/runtime/commands/commandCatalog';

interface DocumentShape {
  paths: Record<string, Record<string, unknown>>;
  'x-agent-tools': Record<string, { name: string; path: string }[]>;
}

export function checkEveryApiSurfaceIsDescribed(
  check: (name: string, condition: boolean) => void,
): void {
  const document = openApiDocument() as DocumentShape;
  check(
    'every canonical HTTP contract reaches the OpenAPI document',
    API_CONTRACTS.every((contract) => document.paths[contract.path]?.[contract.method.toLowerCase()]),
  );

  const tools = Object.values(document['x-agent-tools']).flat();
  const described = new Set(tools.map((tool) => tool.name));
  check('every feature-owned command generates an agent tool contract', allCommands().every((command) => described.has(command.action)));
  check('every generated agent tool names its canonical transport path', tools.every((tool) => document.paths[tool.path] !== undefined));
}
